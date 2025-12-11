/**
 * ZapNest Referral System
 * Generates unique referral codes and tracks referrals
 * 
 * Referral Model:
 * - Referrer gets ₹200 credit on next bill
 * - Referee gets ₹200 off first box
 * - Max 10 referrals per user (₹2,000 total)
 */

// ============================================
// Configuration
// ============================================

const REFERRAL_CONFIG = {
    referrerCredit: 200,      // ₹200 credit for referrer
    refereeDiscount: 200,     // ₹200 discount for new subscriber
    maxReferrals: 10,         // Maximum referrals per user
    codePrefix: 'FOUNDER',    // Prefix for referral codes
    codeLength: 8             // Total code length including prefix
};

// ============================================
// Referral Code Generation
// ============================================

/**
 * Generate a unique referral code for a user
 * Format: FOUNDER-XXXX (where XXXX is alphanumeric)
 */
function generateReferralCode(firstName) {
    // Sanitize first name (remove special chars, uppercase)
    const sanitizedName = firstName
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .substring(0, 6);

    // Generate random suffix
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, 1, I for clarity
    let suffix = '';
    for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Combine: FOUNDER-NAME-XXXX or FOUNDER-XXXX if no name
    if (sanitizedName.length >= 2) {
        return `${REFERRAL_CONFIG.codePrefix}-${sanitizedName}`;
    }
    return `${REFERRAL_CONFIG.codePrefix}-${suffix}`;
}

/**
 * Validate a referral code format
 */
function isValidReferralCode(code) {
    if (!code || typeof code !== 'string') return false;
    const pattern = /^FOUNDER-[A-Z0-9]{2,10}$/;
    return pattern.test(code.toUpperCase().trim());
}

// ============================================
// Supabase Integration
// ============================================

/**
 * Create referral code for a subscriber
 * Call this after successful payment
 */
async function createReferralCode(supabase, subscriberId, firstName) {
    const code = generateReferralCode(firstName);

    const { data, error } = await supabase
        .from('referrals')
        .insert({
            subscriber_id: subscriberId,
            code: code,
            uses: 0,
            max_uses: REFERRAL_CONFIG.maxReferrals,
            credit_per_use: REFERRAL_CONFIG.referrerCredit,
            is_active: true
        })
        .select()
        .single();

    if (error) {
        console.error('[Referral] Error creating code:', error);
        return null;
    }

    return data;
}

/**
 * Apply a referral code during signup
 * Returns discount amount if valid, null if invalid
 */
async function applyReferralCode(supabase, code, newSubscriberId) {
    const cleanCode = code.toUpperCase().trim();

    // Find the referral code
    const { data: referral, error } = await supabase
        .from('referrals')
        .select('*, subscribers(email, name)')
        .eq('code', cleanCode)
        .eq('is_active', true)
        .single();

    if (error || !referral) {
        console.log('[Referral] Invalid or inactive code:', cleanCode);
        return { success: false, error: 'Invalid referral code' };
    }

    // Check if max uses reached
    if (referral.uses >= referral.max_uses) {
        return { success: false, error: 'This referral code has reached its limit' };
    }

    // Check if new subscriber isn't using their own code
    if (referral.subscriber_id === newSubscriberId) {
        return { success: false, error: 'You cannot use your own referral code' };
    }

    // Record the referral usage
    const { error: usageError } = await supabase
        .from('referral_usage')
        .insert({
            referral_id: referral.id,
            referee_id: newSubscriberId,
            discount_applied: REFERRAL_CONFIG.refereeDiscount
        });

    if (usageError) {
        console.error('[Referral] Error recording usage:', usageError);
        return { success: false, error: 'Failed to apply referral' };
    }

    // Increment usage count
    await supabase
        .from('referrals')
        .update({ uses: referral.uses + 1 })
        .eq('id', referral.id);

    // Add credit to referrer
    await addReferrerCredit(supabase, referral.subscriber_id, REFERRAL_CONFIG.referrerCredit);

    return {
        success: true,
        discount: REFERRAL_CONFIG.refereeDiscount,
        referrerName: referral.subscribers?.name || 'A founder'
    };
}

/**
 * Add credit to referrer's account
 */
async function addReferrerCredit(supabase, subscriberId, amount) {
    // Get current credit balance
    const { data: subscriber } = await supabase
        .from('subscribers')
        .select('referral_credit')
        .eq('id', subscriberId)
        .single();

    const currentCredit = subscriber?.referral_credit || 0;

    // Update with new credit
    const { error } = await supabase
        .from('subscribers')
        .update({ referral_credit: currentCredit + amount })
        .eq('id', subscriberId);

    if (error) {
        console.error('[Referral] Error adding credit:', error);
    }

    return !error;
}

/**
 * Get referral stats for a subscriber
 */
async function getReferralStats(supabase, subscriberId) {
    // Get referral code and usage
    const { data: referral } = await supabase
        .from('referrals')
        .select(`
      code,
      uses,
      max_uses,
      referral_usage(created_at)
    `)
        .eq('subscriber_id', subscriberId)
        .single();

    // Get credit balance
    const { data: subscriber } = await supabase
        .from('subscribers')
        .select('referral_credit')
        .eq('id', subscriberId)
        .single();

    return {
        code: referral?.code || null,
        totalReferrals: referral?.uses || 0,
        maxReferrals: referral?.max_uses || REFERRAL_CONFIG.maxReferrals,
        remainingReferrals: (referral?.max_uses || REFERRAL_CONFIG.maxReferrals) - (referral?.uses || 0),
        creditEarned: (referral?.uses || 0) * REFERRAL_CONFIG.referrerCredit,
        creditBalance: subscriber?.referral_credit || 0,
        shareUrl: referral?.code ? `https://zapneststore.in/?ref=${referral.code}` : null
    };
}

// ============================================
// Share Helpers
// ============================================

/**
 * Generate share text for various platforms
 */
function getShareText(code) {
    return {
        whatsapp: `Hey! I just joined ZapNest Black Box - a curated tech subscription. Use my code ${code} to get ₹200 off your first box! 📦✨ https://zapneststore.in/?ref=${code}`,
        twitter: `Just joined @ZapNest Black Box! Use my code ${code} for ₹200 off your first curated tech box 📦 https://zapneststore.in/?ref=${code}`,
        copy: `Use my referral code ${code} on ZapNest to get ₹200 off your first box! https://zapneststore.in/?ref=${code}`
    };
}

/**
 * Get share URLs for various platforms
 */
function getShareUrls(code) {
    const text = getShareText(code);
    const url = `https://zapneststore.in/?ref=${code}`;

    return {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text.whatsapp)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.twitter)}`,
        email: `mailto:?subject=${encodeURIComponent('Get ₹200 off ZapNest Black Box!')}&body=${encodeURIComponent(text.copy)}`
    };
}

// ============================================
// Export
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        REFERRAL_CONFIG,
        generateReferralCode,
        isValidReferralCode,
        createReferralCode,
        applyReferralCode,
        getReferralStats,
        getShareText,
        getShareUrls
    };
}

// Browser export
if (typeof window !== 'undefined') {
    window.ZapNestReferral = {
        generateReferralCode,
        isValidReferralCode,
        createReferralCode,
        applyReferralCode,
        getReferralStats,
        getShareText,
        getShareUrls,
        config: REFERRAL_CONFIG
    };
}
