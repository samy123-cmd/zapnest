/**
 * ZapNest Analytics Events
 * Enhanced tracking for user engagement and conversion optimization
 * 
 * Works with:
 * - Vercel Analytics (page views, web vitals)
 * - Custom event tracking (user actions)
 */

// ============================================
// Configuration
// ============================================

const ANALYTICS_CONFIG = {
    debug: window.location.hostname === 'localhost',
    enabled: true,
    prefix: 'zn_'
};

// ============================================
// Core Tracking Functions
// ============================================

/**
 * Track a custom event
 */
function trackEvent(eventName, properties = {}) {
    if (!ANALYTICS_CONFIG.enabled) return;

    const event = {
        name: ANALYTICS_CONFIG.prefix + eventName,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        ...properties
    };

    // Vercel Analytics
    if (typeof window.va === 'function') {
        window.va('event', { name: event.name, ...properties });
    }

    // Debug logging
    if (ANALYTICS_CONFIG.debug) {
        console.log('[Analytics]', event.name, properties);
    }

    // Store in localStorage for later sync (optional)
    storeEventLocally(event);
}

/**
 * Store events locally for batch processing
 */
function storeEventLocally(event) {
    try {
        const events = JSON.parse(localStorage.getItem('zn_events') || '[]');
        events.push(event);
        // Keep only last 100 events
        if (events.length > 100) events.shift();
        localStorage.setItem('zn_events', JSON.stringify(events));
    } catch (e) {
        // localStorage not available
    }
}

// ============================================
// Page View Events
// ============================================

const PageEvents = {
    /**
     * Landing page viewed
     */
    landingView() {
        trackEvent('page_landing', {
            referrer: document.referrer,
            source: new URLSearchParams(window.location.search).get('ref') || 'direct'
        });
    },

    /**
     * Member dashboard viewed
     */
    dashboardView() {
        trackEvent('page_dashboard');
    },

    /**
     * Payment page viewed
     */
    paymentView(tier) {
        trackEvent('page_payment', { tier });
    },

    /**
     * Legal page viewed
     */
    legalView(pageName) {
        trackEvent('page_legal', { page: pageName });
    }
};

// ============================================
// Conversion Funnel Events
// ============================================

const FunnelEvents = {
    /**
     * CTA clicked on landing page
     */
    ctaClick(ctaId, tier) {
        trackEvent('funnel_cta_click', { cta_id: ctaId, tier });
    },

    /**
     * Modal opened
     */
    modalOpen(modalType, tier) {
        trackEvent('funnel_modal_open', { modal_type: modalType, tier });
    },

    /**
     * Email entered in signup form
     */
    emailEntered(tier) {
        trackEvent('funnel_email_entered', { tier });
    },

    /**
     * Signup form submitted
     */
    signupSubmit(tier, hasReferral) {
        trackEvent('funnel_signup_submit', { tier, has_referral: hasReferral });
    },

    /**
     * Signup completed successfully
     */
    signupComplete(tier, position) {
        trackEvent('funnel_signup_complete', { tier, position });
    },

    /**
     * Payment initiated
     */
    paymentStart(tier, amount) {
        trackEvent('funnel_payment_start', { tier, amount });
    },

    /**
     * Payment completed
     */
    paymentComplete(tier, amount, paymentId) {
        trackEvent('funnel_payment_complete', { tier, amount, payment_id: paymentId });
    },

    /**
     * Payment failed
     */
    paymentFailed(tier, amount, errorCode) {
        trackEvent('funnel_payment_failed', { tier, amount, error_code: errorCode });
    }
};

// ============================================
// Engagement Events
// ============================================

const EngagementEvents = {
    /**
     * FAQ section expanded
     */
    faqExpand(questionId) {
        trackEvent('engage_faq_expand', { question_id: questionId });
    },

    /**
     * Tier card clicked
     */
    tierSelect(tier) {
        trackEvent('engage_tier_select', { tier });
    },

    /**
     * Scroll depth reached
     */
    scrollDepth(percentage) {
        trackEvent('engage_scroll', { depth: percentage });
    },

    /**
     * Time on page milestone
     */
    timeOnPage(seconds) {
        trackEvent('engage_time', { seconds });
    },

    /**
     * Mobile menu opened
     */
    mobileMenuOpen() {
        trackEvent('engage_mobile_menu');
    },

    /**
     * Countdown viewed
     */
    countdownView(daysRemaining) {
        trackEvent('engage_countdown', { days_remaining: daysRemaining });
    }
};

// ============================================
// Referral Events
// ============================================

const ReferralEvents = {
    /**
     * Referral code copied
     */
    codeCopied(code) {
        trackEvent('referral_copy', { code });
    },

    /**
     * Share button clicked
     */
    shareClick(platform, code) {
        trackEvent('referral_share', { platform, code });
    },

    /**
     * Referral code applied
     */
    codeApplied(code, success) {
        trackEvent('referral_apply', { code, success });
    },

    /**
     * Referral landed (visitor came from referral link)
     */
    referralLanded(code) {
        trackEvent('referral_landed', { code });
    }
};

// ============================================
// Member Dashboard Events
// ============================================

const MemberEvents = {
    /**
     * Login attempted
     */
    loginAttempt(method) {
        trackEvent('member_login_attempt', { method });
    },

    /**
     * Login successful
     */
    loginSuccess(method) {
        trackEvent('member_login_success', { method });
    },

    /**
     * Address updated
     */
    addressUpdate() {
        trackEvent('member_address_update');
    },

    /**
     * Tier upgrade initiated
     */
    upgradeStart(fromTier, toTier) {
        trackEvent('member_upgrade_start', { from_tier: fromTier, to_tier: toTier });
    },

    /**
     * Cancellation initiated
     */
    cancelStart(tier, reason) {
        trackEvent('member_cancel_start', { tier, reason });
    },

    /**
     * Cancellation completed
     */
    cancelComplete(tier, reason) {
        trackEvent('member_cancel_complete', { tier, reason });
    }
};

// ============================================
// Error Events
// ============================================

const ErrorEvents = {
    /**
     * Form validation error
     */
    formError(formId, field, message) {
        trackEvent('error_form', { form_id: formId, field, message });
    },

    /**
     * API error
     */
    apiError(endpoint, statusCode) {
        trackEvent('error_api', { endpoint, status_code: statusCode });
    },

    /**
     * JavaScript error
     */
    jsError(message, source, line) {
        trackEvent('error_js', { message, source, line });
    }
};

// ============================================
// Auto-tracking Setup
// ============================================

function initAnalytics() {
    // Track page view on load
    const path = window.location.pathname;
    if (path.includes('/landing')) {
        PageEvents.landingView();
    } else if (path.includes('/member')) {
        PageEvents.dashboardView();
    } else if (path.includes('/payment')) {
        const tier = new URLSearchParams(window.location.search).get('tier') || 'core';
        PageEvents.paymentView(tier);
    }

    // Check for referral code in URL
    const refCode = new URLSearchParams(window.location.search).get('ref');
    if (refCode) {
        ReferralEvents.referralLanded(refCode);
        // Store for later use
        sessionStorage.setItem('zn_referral', refCode);
    }

    // Track scroll depth
    let maxScroll = 0;
    const scrollMilestones = [25, 50, 75, 100];
    window.addEventListener('scroll', () => {
        const scrollPercent = Math.round(
            (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
        scrollMilestones.forEach(milestone => {
            if (scrollPercent >= milestone && maxScroll < milestone) {
                maxScroll = milestone;
                EngagementEvents.scrollDepth(milestone);
            }
        });
    }, { passive: true });

    // Track time on page
    const timePoints = [30, 60, 120, 300]; // seconds
    timePoints.forEach(seconds => {
        setTimeout(() => {
            EngagementEvents.timeOnPage(seconds);
        }, seconds * 1000);
    });

    // Track JS errors
    window.addEventListener('error', (event) => {
        ErrorEvents.jsError(
            event.message,
            event.filename,
            event.lineno
        );
    });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalytics);
} else {
    initAnalytics();
}

// ============================================
// Export
// ============================================

if (typeof window !== 'undefined') {
    window.ZapNestAnalytics = {
        track: trackEvent,
        page: PageEvents,
        funnel: FunnelEvents,
        engage: EngagementEvents,
        referral: ReferralEvents,
        member: MemberEvents,
        error: ErrorEvents
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        trackEvent,
        PageEvents,
        FunnelEvents,
        EngagementEvents,
        ReferralEvents,
        MemberEvents,
        ErrorEvents
    };
}
