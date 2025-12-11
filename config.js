/**
 * ZapNest Configuration
 * 
 * This file centralizes all configuration and API keys.
 * For production, these values should be replaced with environment variables
 * or loaded from a secure backend.
 * 
 * IMPORTANT: Never commit actual API keys to version control.
 * Use this file as a template and replace values at deployment time.
 */

(function () {
    'use strict';

    // Configuration object
    const CONFIG = {
        // ============================================
        // Supabase Configuration
        // ============================================
        supabase: {
            url: window.SUPABASE_URL || 'https://your-project.supabase.co',
            anonKey: window.SUPABASE_ANON_KEY || 'your-anon-key',
            // Service role key should NEVER be exposed in frontend
            // Only use in server-side code
        },

        // ============================================
        // Razorpay Configuration  
        // ============================================
        razorpay: {
            key: window.RAZORPAY_KEY || 'rzp_test_XXXXXXXXXX',
            // Use rzp_live_XXXXXXXXXX for production
        },

        // ============================================
        // Application Settings
        // ============================================
        app: {
            name: 'ZapNest',
            tagline: 'Tech That Earns Its Place',
            supportEmail: 'hello@zapneststore.in',
            foundersLimit: 500,
        },

        // ============================================
        // Tier Pricing (in INR)
        // ============================================
        tiers: {
            lite: {
                name: 'Lite',
                price: 1499,
                description: '1 accessory product monthly',
            },
            core: {
                name: 'Core',
                price: 2999,
                description: '1 hero + 1-2 accessories',
                featured: true,
            },
            elite: {
                name: 'Elite',
                price: 4999,
                description: 'Premium hero + 2-3 curated items',
            },
        },

        // ============================================
        // Feature Flags
        // ============================================
        features: {
            referralProgram: true,
            magicLinkAuth: true,
            emailNurture: true,
        },

        // ============================================
        // Environment Detection
        // ============================================
        isDevelopment: window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1',
        isProduction: window.location.hostname.includes('zapneststore.in'),
    };

    // Freeze config to prevent modifications
    Object.freeze(CONFIG);
    Object.freeze(CONFIG.supabase);
    Object.freeze(CONFIG.razorpay);
    Object.freeze(CONFIG.app);
    Object.freeze(CONFIG.tiers);
    Object.freeze(CONFIG.features);

    // Export to global scope
    window.ZAPNEST_CONFIG = CONFIG;

    // Helper functions
    window.getConfig = function (path) {
        return path.split('.').reduce((obj, key) => obj?.[key], CONFIG);
    };

    window.formatPrice = function (amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Log environment in development
    if (CONFIG.isDevelopment) {
        console.log('[ZapNest] Running in development mode');
        console.log('[ZapNest] Config loaded:', {
            supabaseUrl: CONFIG.supabase.url,
            razorpayKey: CONFIG.razorpay.key.substring(0, 15) + '...',
            isDevelopment: CONFIG.isDevelopment,
        });
    }

})();
