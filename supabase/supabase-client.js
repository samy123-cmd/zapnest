/**
 * ZapNest Supabase Client Configuration
 * 
 * Usage:
 * 1. Copy this file to your project
 * 2. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables
 * 3. Import: import { supabase, waitlistAPI } from './supabase-client.js'
 */

// ============================================
// Configuration
// ============================================

const SUPABASE_URL = typeof process !== 'undefined'
    ? process.env.SUPABASE_URL
    : window.SUPABASE_URL || '';

const SUPABASE_ANON_KEY = typeof process !== 'undefined'
    ? process.env.SUPABASE_ANON_KEY
    : window.SUPABASE_ANON_KEY || '';

// ============================================
// Supabase Client (Browser-compatible)
// ============================================

class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.headers = {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    }

    async from(table) {
        return new QueryBuilder(this.url, this.headers, table);
    }

    async rpc(functionName, params = {}) {
        const response = await fetch(`${this.url}/rest/v1/rpc/${functionName}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'RPC call failed');
        }

        return response.json();
    }
}

class QueryBuilder {
    constructor(url, headers, table) {
        this.baseUrl = `${url}/rest/v1/${table}`;
        this.headers = headers;
        this.queryParams = new URLSearchParams();
        this.method = 'GET';
        this.body = null;
    }

    select(columns = '*') {
        this.queryParams.set('select', columns);
        return this;
    }

    insert(data) {
        this.method = 'POST';
        this.body = JSON.stringify(data);
        return this;
    }

    update(data) {
        this.method = 'PATCH';
        this.body = JSON.stringify(data);
        return this;
    }

    delete() {
        this.method = 'DELETE';
        return this;
    }

    eq(column, value) {
        this.queryParams.append(column, `eq.${value}`);
        return this;
    }

    order(column, { ascending = true } = {}) {
        this.queryParams.set('order', `${column}.${ascending ? 'asc' : 'desc'}`);
        return this;
    }

    limit(count) {
        this.headers['Range'] = `0-${count - 1}`;
        return this;
    }

    single() {
        this.headers['Accept'] = 'application/vnd.pgrst.object+json';
        return this;
    }

    async execute() {
        const url = this.queryParams.toString()
            ? `${this.baseUrl}?${this.queryParams}`
            : this.baseUrl;

        try {
            const response = await fetch(url, {
                method: this.method,
                headers: this.headers,
                body: this.body
            });

            if (!response.ok) {
                const error = await response.json();
                return { data: null, error };
            }

            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error: { message: error.message } };
        }
    }
}

// ============================================
// Supabase Instance
// ============================================

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// Waitlist API
// ============================================

const waitlistAPI = {
    /**
     * Add a new signup to the waitlist
     * @param {Object} data - Signup data
     * @param {string} data.email - Email address
     * @param {string} data.tier - Selected tier (lite|core|elite)
     * @param {string} [data.referral_code] - Referral code if any
     * @param {boolean} data.consent - User consent
     * @param {string} [data.source] - Traffic source
     */
    async signup(data) {
        // Hash email for privacy
        const emailHash = await hashEmail(data.email);

        const payload = {
            email: data.email,
            email_hash: emailHash,
            tier: data.tier,
            referral_code: data.referral_code || null,
            consent: data.consent,
            source: data.source || document.referrer || 'direct'
        };

        const builder = await supabase.from('waitlist');
        const result = await builder.insert(payload).execute();

        if (result.error) {
            // Check for duplicate email
            if (result.error.code === '23505') {
                return {
                    success: false,
                    error: 'This email is already on the waitlist.'
                };
            }
            return { success: false, error: result.error.message };
        }

        // If referral code provided, increment uses
        if (data.referral_code) {
            try {
                await supabase.rpc('increment_referral_uses', {
                    ref_code: data.referral_code
                });
            } catch (e) {
                console.warn('Failed to increment referral:', e);
            }
        }

        return {
            success: true,
            data: result.data,
            message: 'Successfully joined the waitlist!'
        };
    },

    /**
     * Check if a referral code is valid
     * @param {string} code - Referral code to validate
     */
    async validateReferralCode(code) {
        const builder = await supabase.from('referral_codes');
        const result = await builder
            .select('code, uses, max_uses')
            .eq('code', code.toUpperCase())
            .single()
            .execute();

        if (result.error || !result.data) {
            return { valid: false };
        }

        const { max_uses, uses } = result.data;
        if (max_uses !== null && uses >= max_uses) {
            return { valid: false, reason: 'Code has reached maximum uses' };
        }

        return { valid: true };
    },

    /**
     * Get waitlist stats (admin only - requires service role)
     */
    async getStats() {
        const builder = await supabase.from('waitlist_stats');
        const result = await builder.select('*').single().execute();
        return result;
    },

    /**
     * Get all waitlist entries (admin only)
     * @param {Object} options
     * @param {number} [options.limit=50]
     * @param {string} [options.tier]
     */
    async getEntries(options = {}) {
        const builder = await supabase.from('waitlist');
        let query = builder.select('id, email, tier, referral_code, created_at');

        if (options.tier) {
            query = query.eq('tier', options.tier);
        }

        query = query.order('created_at', { ascending: false });

        if (options.limit) {
            query = query.limit(options.limit);
        }

        return query.execute();
    }
};

// ============================================
// Analytics API
// ============================================

const analyticsAPI = {
    /**
     * Track an event
     * @param {string} eventName - Event name
     * @param {Object} eventData - Event data (no PII!)
     */
    async track(eventName, eventData = {}) {
        // Only track if consent given
        if (!window.ANALYTICS_CONSENT) {
            console.log('[Analytics] Skipped (no consent):', eventName);
            return;
        }

        const payload = {
            event_name: eventName,
            event_data: eventData,
            session_id: getSessionId(),
            page_url: window.location.pathname,
            referrer: document.referrer
        };

        try {
            const builder = await supabase.from('analytics_events');
            await builder.insert(payload).execute();
        } catch (e) {
            console.warn('[Analytics] Failed to track:', e);
        }
    }
};

// ============================================
// Utility Functions
// ============================================

/**
 * Hash email using SHA-256
 */
async function hashEmail(email) {
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create session ID
 */
function getSessionId() {
    let sessionId = sessionStorage.getItem('zn_session_id');
    if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('zn_session_id', sessionId);
    }
    return sessionId;
}

// ============================================
// Exports
// ============================================

// ES Module export
export { supabase, waitlistAPI, analyticsAPI, hashEmail };

// Also attach to window for non-module usage
if (typeof window !== 'undefined') {
    window.ZapNestAPI = { supabase, waitlistAPI, analyticsAPI };
}
