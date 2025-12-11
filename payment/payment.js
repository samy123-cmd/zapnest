/**
 * ZapNest Payment Page
 * Razorpay Checkout Integration
 */

(function () {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    const SUPABASE_URL = window.SUPABASE_URL;
    const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
    const RAZORPAY_KEY = window.RAZORPAY_KEY || 'rzp_test_XXXXXXXXXX';

    // Tier pricing in paise (for Razorpay)
    const TIER_CONFIG = {
        lite: {
            name: 'Lite',
            price: 149900, // ₹1,499
            priceDisplay: '1,499',
            description: '1 accessory product monthly'
        },
        core: {
            name: 'Core',
            price: 299900, // ₹2,999
            priceDisplay: '2,999',
            description: '1 hero + 1-2 accessories'
        },
        elite: {
            name: 'Elite',
            price: 499900, // ₹4,999
            priceDisplay: '4,999',
            description: 'Premium hero + 2-3 curated items'
        }
    };

    // ============================================
    // State
    // ============================================
    let selectedTier = 'core';

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        tierSelection: document.getElementById('tier-selection'),
        tierRadios: document.querySelectorAll('input[name="tier"]'),
        summaryTier: document.getElementById('summary-tier'),
        summaryPrice: document.getElementById('summary-price'),
        btnPrice: document.getElementById('btn-price'),
        emailInput: document.getElementById('payment-email'),
        phoneInput: document.getElementById('payment-phone'),
        payBtn: document.getElementById('pay-btn'),
        successModal: document.getElementById('success-modal'),
        errorModal: document.getElementById('error-modal'),
        modalTier: document.getElementById('modal-tier'),
        errorMessage: document.getElementById('error-message')
    };

    // ============================================
    // Tier Selection
    // ============================================

    function handleTierChange(tier) {
        selectedTier = tier;
        const config = TIER_CONFIG[tier];

        // Update summary
        elements.summaryTier.textContent = config.name;
        elements.summaryPrice.textContent = `₹${config.priceDisplay}`;
        elements.btnPrice.textContent = config.priceDisplay;

        console.log('[ZapNest] Selected tier:', tier);
    }

    function initTierSelection() {
        elements.tierRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    handleTierChange(e.target.value);
                }
            });
        });

        // Set initial selection
        const checkedRadio = document.querySelector('input[name="tier"]:checked');
        if (checkedRadio) {
            handleTierChange(checkedRadio.value);
        }
    }

    // ============================================
    // Form Validation
    // ============================================

    function validateForm() {
        const email = elements.emailInput.value.trim();
        const phone = elements.phoneInput.value.trim();

        if (!email || !email.includes('@')) {
            showError('Please enter a valid email address.');
            elements.emailInput.focus();
            return false;
        }

        if (!phone || phone.length < 10) {
            showError('Please enter a valid phone number.');
            elements.phoneInput.focus();
            return false;
        }

        return true;
    }

    // ============================================
    // Razorpay Checkout
    // ============================================

    function initiatePayment() {
        if (!validateForm()) return;

        const config = TIER_CONFIG[selectedTier];
        const email = elements.emailInput.value.trim();
        const phone = elements.phoneInput.value.trim().replace(/\D/g, '');

        // Show loading state
        elements.payBtn.classList.add('loading');
        elements.payBtn.disabled = true;

        // Create Razorpay order (in production, this would be a server call)
        // For demo, we'll use client-side checkout

        const options = {
            key: RAZORPAY_KEY,
            amount: config.price,
            currency: 'INR',
            name: 'ZapNest Black Box',
            description: `${config.name} Subscription - Founders Batch`,
            image: 'https://zapnest.in/logo.png', // Replace with actual logo

            // Subscription mode (for recurring)
            // subscription_id: 'sub_XXXXXXXXXX',

            prefill: {
                email: email,
                contact: phone
            },

            notes: {
                tier: selectedTier,
                is_founder: true
            },

            theme: {
                color: '#00FF88',
                backdrop_color: 'rgba(5, 5, 5, 0.9)'
            },

            handler: function (response) {
                // Payment successful
                handlePaymentSuccess(response, email);
            },

            modal: {
                ondismiss: function () {
                    // User closed the modal without completing
                    elements.payBtn.classList.remove('loading');
                    elements.payBtn.disabled = false;
                },
                escape: true,
                animation: true
            }
        };

        try {
            const rzp = new Razorpay(options);

            rzp.on('payment.failed', function (response) {
                handlePaymentFailure(response.error);
            });

            rzp.open();

            // Remove loading after modal opens
            setTimeout(() => {
                elements.payBtn.classList.remove('loading');
                elements.payBtn.disabled = false;
            }, 1000);

        } catch (error) {
            console.error('[ZapNest] Razorpay error:', error);
            showError('Payment gateway error. Please try again.');
            elements.payBtn.classList.remove('loading');
            elements.payBtn.disabled = false;
        }
    }

    // ============================================
    // Payment Handlers
    // ============================================

    async function handlePaymentSuccess(response, email) {
        console.log('[ZapNest] Payment successful:', response);

        const config = TIER_CONFIG[selectedTier];

        try {
            // Save to Supabase
            await saveSubscriber(email, response);

            // Show success modal
            elements.modalTier.textContent = config.name;
            elements.successModal.hidden = false;

            // Track conversion
            trackEvent('purchase', {
                tier: selectedTier,
                amount: config.price / 100,
                currency: 'INR'
            });

        } catch (error) {
            console.error('[ZapNest] Save error:', error);
            // Still show success - payment went through
            elements.modalTier.textContent = config.name;
            elements.successModal.hidden = false;
        }
    }

    function handlePaymentFailure(error) {
        console.error('[ZapNest] Payment failed:', error);

        let message = 'Payment failed. Please try again.';

        if (error.description) {
            message = error.description;
        } else if (error.reason) {
            message = error.reason;
        }

        showError(message);

        elements.payBtn.classList.remove('loading');
        elements.payBtn.disabled = false;
    }

    // ============================================
    // Supabase Integration
    // ============================================

    async function saveSubscriber(email, paymentResponse) {
        const config = TIER_CONFIG[selectedTier];

        // Generate referral code
        const referralCode = 'ZN' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const subscriberData = {
            email: email.toLowerCase(),
            tier: selectedTier,
            status: 'active',
            monthly_price: config.price / 100, // Convert paise to rupees
            is_founder: true,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            referral_code: referralCode,
            next_billing_date: getNextBillingDate()
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(subscriberData)
        });

        if (!response.ok) {
            // Check if already exists
            const errorData = await response.json();
            if (errorData.code === '23505') {
                // Duplicate - update instead
                console.log('[ZapNest] Subscriber exists, updating...');
                return updateSubscriber(email, paymentResponse);
            }
            throw new Error('Failed to save subscriber');
        }

        return response.json();
    }

    async function updateSubscriber(email, paymentResponse) {
        const config = TIER_CONFIG[selectedTier];

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(email)}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    tier: selectedTier,
                    status: 'active',
                    monthly_price: config.price / 100,
                    is_founder: true,
                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                    next_billing_date: getNextBillingDate()
                })
            }
        );

        return response.json();
    }

    function getNextBillingDate() {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        return date.toISOString();
    }

    // ============================================
    // Error Handling
    // ============================================

    function showError(message) {
        elements.errorMessage.textContent = message;
        elements.errorModal.hidden = false;
    }

    window.closeErrorModal = function () {
        elements.errorModal.hidden = true;
    };

    // ============================================
    // Analytics
    // ============================================

    function trackEvent(eventName, params) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, params);
        }
        console.log('[ZapNest] Event:', eventName, params);
    }

    // ============================================
    // URL Parameters
    // ============================================

    function handleURLParams() {
        const params = new URLSearchParams(window.location.search);

        // Pre-select tier from URL
        const tierParam = params.get('tier');
        if (tierParam && TIER_CONFIG[tierParam]) {
            const radio = document.querySelector(`input[value="${tierParam}"]`);
            if (radio) {
                radio.checked = true;
                handleTierChange(tierParam);
            }
        }

        // Pre-fill email from URL
        const emailParam = params.get('email');
        if (emailParam) {
            elements.emailInput.value = emailParam;
        }
    }

    // ============================================
    // Initialization
    // ============================================

    function init() {
        // Check if Razorpay is loaded
        if (typeof Razorpay === 'undefined') {
            console.warn('[ZapNest] Razorpay not loaded. Payment disabled.');
            elements.payBtn.disabled = true;
            elements.payBtn.innerHTML = '<span>Payment Unavailable</span>';
            return;
        }

        // Initialize tier selection
        initTierSelection();

        // Handle URL params
        handleURLParams();

        // Pay button click
        elements.payBtn.addEventListener('click', initiatePayment);

        // Close modals on overlay click
        document.querySelectorAll('.payment-modal__overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                elements.successModal.hidden = true;
                elements.errorModal.hidden = true;
            });
        });

        console.log('[ZapNest] Payment page initialized');
        console.log('[ZapNest] Using Razorpay key:', RAZORPAY_KEY.substring(0, 12) + '...');
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
