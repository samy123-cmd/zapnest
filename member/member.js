/**
 * ZapNest Member Dashboard
 * JavaScript - Auth, Navigation, Data Loading
 */

(function () {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    const SUPABASE_URL = window.SUPABASE_URL;
    const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

    // ============================================
    // State
    // ============================================
    let currentUser = null;
    let subscription = null;

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        loginView: document.getElementById('login-view'),
        loginForm: document.getElementById('login-form'),
        loginEmail: document.getElementById('login-email'),
        loginSuccess: document.getElementById('login-success'),
        sentEmail: document.getElementById('sent-email'),
        userEmail: document.getElementById('user-email'),
        logoutBtn: document.getElementById('logout-btn'),
        navItems: document.querySelectorAll('.member-nav__item'),
        sections: document.querySelectorAll('.member-section'),

        // Waitlist Hero
        waitlistHero: document.getElementById('waitlist-hero'),
        slotsRemaining: document.getElementById('slots-remaining'),
        userPosition: document.getElementById('user-position'),
        preferredTierDisplay: document.getElementById('preferred-tier-display'),

        // Subscription Stats (hidden for waitlist)
        subscriptionStats: document.getElementById('subscription-stats'),
        nextBoxCard: document.getElementById('next-box-card'),
        statTier: document.getElementById('stat-tier'),
        statStatus: document.getElementById('stat-status'),
        statBilling: document.getElementById('stat-billing'),
        statBoxes: document.getElementById('stat-boxes'),

        // Founder badge
        founderBadge: document.getElementById('founder-badge'),

        // Subscription
        subTierName: document.getElementById('sub-tier-name'),
        subPrice: document.getElementById('sub-price'),

        // Referral
        referralCode: document.getElementById('referral-code'),
        copyCodeBtn: document.getElementById('copy-code-btn'),

        // Action buttons
        changeTierBtn: document.getElementById('change-tier-btn'),
        pauseBtn: document.getElementById('pause-btn'),
        cancelSubBtn: document.getElementById('cancel-sub-btn'),

        // Address form
        addressForm: document.getElementById('address-form'),
        addressName: document.getElementById('address-name'),
        addressPhone: document.getElementById('address-phone'),
        addressLine1: document.getElementById('address-line1'),
        addressLine2: document.getElementById('address-line2'),
        addressCity: document.getElementById('address-city'),
        addressState: document.getElementById('address-state'),
        addressPincode: document.getElementById('address-pincode'),

        // Modals
        modalChangeTier: document.getElementById('modal-change-tier'),
        modalPause: document.getElementById('modal-pause'),
        modalCancel: document.getElementById('modal-cancel'),
        confirmTierChange: document.getElementById('confirm-tier-change'),
        confirmPause: document.getElementById('confirm-pause'),
        confirmCancel: document.getElementById('confirm-cancel'),

        // Toast
        toast: document.getElementById('toast'),
        toastIcon: document.getElementById('toast-icon'),
        toastTitle: document.getElementById('toast-title'),
        toastMessage: document.getElementById('toast-message'),

        // Payment
        completeSubscriptionBtn: document.getElementById('complete-subscription-btn')
    };

    // Waitlist data
    let waitlistData = null;

    // ============================================
    // Supabase API Helpers
    // ============================================

    async function supabaseFetch(path, options = {}) {
        const url = `${SUPABASE_URL}/rest/v1${path}`;
        const headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            ...options.headers
        };

        const response = await fetch(url, { ...options, headers });
        return response;
    }

    // ============================================
    // Auth Functions
    // ============================================

    function checkAuth() {
        // Check for session token in URL (magic link callback)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const email = urlParams.get('email');

        if (token && email) {
            // Validate token and create session
            validateMagicLink(token, email);
            return;
        }

        // Check localStorage for existing session
        const session = localStorage.getItem('zn_session');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                if (sessionData.expires_at > Date.now()) {
                    currentUser = sessionData;
                    showDashboard();
                    loadUserData();
                    return;
                } else {
                    localStorage.removeItem('zn_session');
                }
            } catch (e) {
                localStorage.removeItem('zn_session');
            }
        }

        // Show login
        showLogin();
    }

    async function sendMagicLink(email) {
        try {
            // Generate token
            const token = generateToken();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Store session request in Supabase
            const response = await supabaseFetch('/member_sessions', {
                method: 'POST',
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    token: token,
                    expires_at: expiresAt.toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            // Generate magic link
            const magicLink = `${window.location.origin}/member/?token=${token}&email=${encodeURIComponent(email)}`;
            console.log('[ZapNest] Magic Link generated:', magicLink);

            // Send email via API route
            try {
                const emailResponse = await fetch('/api/send-magic-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email.toLowerCase().trim(), magicLink })
                });
                const emailResult = await emailResponse.json();
                if (emailResult.success) {
                    console.log('[ZapNest] Magic link email sent:', emailResult.id);
                } else {
                    console.warn('[ZapNest] Email send failed, but link created:', emailResult.error);
                }
            } catch (emailError) {
                console.warn('[ZapNest] Email send failed, but link created:', emailError);
                // Continue anyway - the link is still valid
            }

            // Show success message
            elements.loginForm.hidden = true;
            elements.loginSuccess.hidden = false;
            elements.sentEmail.textContent = email;

            return true;
        } catch (error) {
            console.error('[ZapNest] Magic link error:', error);
            return false;
        }
    }

    async function validateMagicLink(token, email) {
        try {
            // Check token in database
            const response = await supabaseFetch(
                `/member_sessions?token=eq.${token}&email=eq.${encodeURIComponent(email)}&used=eq.false&select=*`,
                { headers: { 'Prefer': 'return=representation' } }
            );

            if (!response.ok) {
                throw new Error('Invalid session');
            }

            const sessions = await response.json();
            if (sessions.length === 0) {
                alert('This magic link is invalid or has expired.');
                showLogin();
                return;
            }

            const session = sessions[0];
            if (new Date(session.expires_at) < new Date()) {
                alert('This magic link has expired. Please request a new one.');
                showLogin();
                return;
            }

            // Mark session as used
            await supabaseFetch(`/member_sessions?id=eq.${session.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ used: true })
            });

            // Create local session
            const localSession = {
                email: email,
                expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                created_at: Date.now()
            };

            localStorage.setItem('zn_session', JSON.stringify(localSession));
            currentUser = localSession;

            // Clean URL
            window.history.replaceState({}, document.title, '/member/');

            showDashboard();
            loadUserData();

        } catch (error) {
            console.error('[ZapNest] Validation error:', error);
            alert('Something went wrong. Please try again.');
            showLogin();
        }
    }

    function logout() {
        localStorage.removeItem('zn_session');
        currentUser = null;
        subscription = null;
        showLogin();
    }

    function generateToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }

    // ============================================
    // View Functions
    // ============================================

    function showLogin() {
        elements.loginView.hidden = false;
        elements.navItems.forEach(item => item.style.display = 'none');
        document.querySelectorAll('.member-section:not(#login-view)').forEach(el => el.hidden = true);
        document.querySelector('.member-sidebar').style.display = 'none';
        elements.userEmail.parentElement.style.display = 'none';
    }

    function showDashboard() {
        elements.loginView.hidden = true;
        elements.navItems.forEach(item => item.style.display = 'flex');
        document.querySelector('.member-sidebar').style.display = 'block';
        elements.userEmail.parentElement.style.display = 'flex';
        elements.userEmail.textContent = currentUser.email;

        // Show dashboard section
        showSection('dashboard');
    }

    function showSection(sectionId) {
        // Update nav
        elements.navItems.forEach(item => {
            item.classList.toggle('member-nav__item--active', item.dataset.section === sectionId);
        });

        // Update sections
        document.querySelectorAll('.member-section').forEach(section => {
            section.hidden = section.id !== sectionId;
        });
    }

    // ============================================
    // Data Loading
    // ============================================

    async function loadUserData() {
        if (!currentUser) return;

        try {
            // Load subscriber data
            const response = await supabaseFetch(
                `/subscribers?email=eq.${encodeURIComponent(currentUser.email)}&select=*`
            );

            if (response.ok) {
                const subscribers = await response.json();
                if (subscribers.length > 0) {
                    subscription = subscribers[0];
                    updateDashboard();
                } else {
                    // User is on waitlist but not subscribed yet
                    showWaitlistState();
                }
            }
        } catch (error) {
            console.error('[ZapNest] Load error:', error);
        }
    }

    function updateDashboard() {
        if (!subscription) return;

        // Update stats
        elements.statTier.textContent = capitalizeFirst(subscription.tier);
        elements.statStatus.textContent = capitalizeFirst(subscription.status);

        if (subscription.next_billing_date) {
            const date = new Date(subscription.next_billing_date);
            elements.statBilling.textContent = date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
            });
        }

        // Show founder badge if applicable
        if (subscription.is_founder) {
            elements.founderBadge.hidden = false;
        }

        // Update subscription page
        elements.subTierName.textContent = capitalizeFirst(subscription.tier);
        elements.subPrice.textContent = `₹${subscription.monthly_price.toLocaleString('en-IN')}`;

        // Update referral code
        if (subscription.referral_code) {
            elements.referralCode.textContent = subscription.referral_code;
        }
    }

    async function showWaitlistState() {
        // Show waitlist hero, hide subscription stats
        if (elements.waitlistHero) elements.waitlistHero.hidden = false;
        if (elements.subscriptionStats) elements.subscriptionStats.hidden = true;
        if (elements.nextBoxCard) elements.nextBoxCard.hidden = true;

        // Load waitlist data from DB
        try {
            const response = await supabaseFetch(
                `/waitlist?email=eq.${encodeURIComponent(currentUser.email)}&select=*`
            );
            if (response.ok) {
                const waitlistEntries = await response.json();
                if (waitlistEntries.length > 0) {
                    waitlistData = waitlistEntries[0];

                    // Display tier
                    if (elements.preferredTierDisplay) {
                        elements.preferredTierDisplay.textContent = capitalizeFirst(waitlistData.tier || 'Core');
                    }

                    // Generate referral code if not exists
                    if (!waitlistData.referral_code) {
                        const code = generateReferralCode();
                        await updateWaitlistData({ referral_code: code });
                        waitlistData.referral_code = code;
                    }
                    if (elements.referralCode) {
                        elements.referralCode.textContent = waitlistData.referral_code || '—';
                    }
                }
            }
        } catch (error) {
            console.error('[ZapNest] Error loading waitlist data:', error);
        }

        // Load total slots remaining
        try {
            const response = await supabaseFetch('/waitlist?select=id', {
                headers: { 'Prefer': 'count=exact' }
            });
            if (response.ok) {
                const countHeader = response.headers.get('content-range');
                if (countHeader) {
                    const match = countHeader.match(/\/(\d+)/);
                    if (match) {
                        const totalSignups = parseInt(match[1]);
                        const slotsRemaining = Math.max(0, 500 - totalSignups);
                        if (elements.slotsRemaining) {
                            elements.slotsRemaining.textContent = slotsRemaining.toString();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[ZapNest] Error loading slots:', error);
        }

        // Update user position
        if (waitlistData && waitlistData.id && elements.userPosition) {
            try {
                const response = await supabaseFetch(
                    `/waitlist?id=lte.${waitlistData.id}&select=id`,
                    { headers: { 'Prefer': 'count=exact' } }
                );
                if (response.ok) {
                    const countHeader = response.headers.get('content-range');
                    if (countHeader) {
                        const match = countHeader.match(/\/(\d+)/);
                        if (match) {
                            elements.userPosition.textContent = `#${match[1]}`;
                        }
                    }
                }
            } catch (error) {
                console.error('[ZapNest] Error loading position:', error);
            }
        }

        // Load address if exists
        loadSavedAddress();
    }

    function generateReferralCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'ZN-';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async function updateWaitlistData(updates) {
        if (!waitlistData || !waitlistData.id) return;
        try {
            await supabaseFetch(`/waitlist?id=eq.${waitlistData.id}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
            Object.assign(waitlistData, updates);
        } catch (error) {
            console.error('[ZapNest] Error updating waitlist:', error);
        }
    }

    async function loadSavedAddress() {
        if (!waitlistData) return;
        // Load address from waitlist or subscribers table
        if (waitlistData.address_json) {
            const addr = typeof waitlistData.address_json === 'string'
                ? JSON.parse(waitlistData.address_json)
                : waitlistData.address_json;
            if (elements.addressName) elements.addressName.value = addr.name || '';
            if (elements.addressPhone) elements.addressPhone.value = addr.phone || '';
            if (elements.addressLine1) elements.addressLine1.value = addr.line1 || '';
            if (elements.addressLine2) elements.addressLine2.value = addr.line2 || '';
            if (elements.addressCity) elements.addressCity.value = addr.city || '';
            if (elements.addressState) elements.addressState.value = addr.state || '';
            if (elements.addressPincode) elements.addressPincode.value = addr.pincode || '';
        }
    }

    // ============================================
    // Toast Functions
    // ============================================

    function showToast(title, message, isError = false) {
        if (!elements.toast) return;

        elements.toastTitle.textContent = title;
        elements.toastMessage.textContent = message;
        elements.toastIcon.textContent = isError ? '✕' : '✓';
        elements.toast.classList.toggle('member-toast--error', isError);
        elements.toast.hidden = false;

        setTimeout(() => {
            elements.toast.hidden = true;
        }, 5000);
    }

    // ============================================
    // Modal Functions
    // ============================================

    function openModal(modal) {
        if (modal) {
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modal) {
        if (modal) {
            modal.hidden = true;
            document.body.style.overflow = '';
        }
    }

    function closeAllModals() {
        [elements.modalChangeTier, elements.modalPause, elements.modalCancel].forEach(m => {
            if (m) m.hidden = true;
        });
        document.body.style.overflow = '';
    }

    // ============================================
    // Event Handlers
    // ============================================

    function handleLoginSubmit(e) {
        e.preventDefault();

        const email = elements.loginEmail.value.trim();
        if (!email) return;

        const btn = e.target.querySelector('button');
        btn.classList.add('loading');

        sendMagicLink(email).finally(() => {
            btn.classList.remove('loading');
        });
    }

    function handleNavClick(e) {
        e.preventDefault();
        const section = e.currentTarget.dataset.section;
        if (section) {
            showSection(section);
            window.location.hash = section;
        }
    }

    function handleCopyCode() {
        const code = elements.referralCode.textContent;
        if (code && code !== '—') {
            navigator.clipboard.writeText(code);
            elements.copyCodeBtn.textContent = 'Copied!';
            setTimeout(() => {
                elements.copyCodeBtn.textContent = 'Copy';
            }, 2000);
        }
    }

    async function handleAddressSubmit(e) {
        e.preventDefault();

        const address = {
            name: elements.addressName?.value?.trim() || '',
            phone: elements.addressPhone?.value?.trim() || '',
            line1: elements.addressLine1?.value?.trim() || '',
            line2: elements.addressLine2?.value?.trim() || '',
            city: elements.addressCity?.value?.trim() || '',
            state: elements.addressState?.value?.trim() || '',
            pincode: elements.addressPincode?.value?.trim() || ''
        };

        // Validate required fields
        if (!address.name || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
            showToast('Missing Fields', 'Please fill in all required fields', true);
            return;
        }

        // Validate phone
        if (!/^[6-9]\d{9}$/.test(address.phone.replace(/\D/g, '').slice(-10))) {
            showToast('Invalid Phone', 'Please enter a valid 10-digit phone number', true);
            return;
        }

        // Validate pincode
        if (!/^\d{6}$/.test(address.pincode)) {
            showToast('Invalid Pincode', 'Please enter a valid 6-digit pincode', true);
            return;
        }

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
            await updateWaitlistData({ address_json: address });
            showToast('Address Saved', 'Your shipping address has been updated');
        } catch (error) {
            showToast('Error', 'Failed to save address. Please try again.', true);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Address';
        }
    }

    async function handleTierChange() {
        const selectedTier = document.querySelector('input[name="modal-tier"]:checked')?.value;
        if (!selectedTier) {
            showToast('Select a Tier', 'Please choose a subscription tier', true);
            return;
        }

        try {
            await updateWaitlistData({ tier: selectedTier });
            if (elements.preferredTierDisplay) {
                elements.preferredTierDisplay.textContent = capitalizeFirst(selectedTier);
            }
            closeModal(elements.modalChangeTier);
            showToast('Tier Updated', `Your preferred tier is now ${capitalizeFirst(selectedTier)}`);
        } catch (error) {
            showToast('Error', 'Failed to update tier. Please try again.', true);
        }
    }

    async function handlePause() {
        const duration = document.querySelector('input[name="pause-duration"]:checked')?.value;
        if (!duration) {
            showToast('Select Duration', 'Please choose how long to pause', true);
            return;
        }

        closeModal(elements.modalPause);
        showToast('Pause Requested', `Your subscription will pause for ${duration} month(s). We'll notify you before it resumes.`);
    }

    async function handleCancelConfirm() {
        if (!waitlistData) return;

        const btn = elements.confirmCancel;
        btn.disabled = true;
        btn.textContent = 'Removing...';

        try {
            // Delete from waitlist
            await supabaseFetch(`/waitlist?id=eq.${waitlistData.id}`, {
                method: 'DELETE'
            });

            closeModal(elements.modalCancel);
            showToast('Removed from Waitlist', 'You have been removed from the Founders waitlist.');

            // Logout after 2 seconds
            setTimeout(() => {
                logout();
            }, 2000);
        } catch (error) {
            showToast('Error', 'Failed to remove from waitlist. Please try again.', true);
            btn.disabled = false;
            btn.textContent = 'Yes, Remove Me';
        }
    }

    // ============================================
    // Payment Functions
    // ============================================

    async function handlePayment() {
        if (!currentUser || !waitlistData) {
            showToast('Error', 'Please log in to complete your subscription', true);
            return;
        }

        const btn = elements.completeSubscriptionBtn;
        btn.classList.add('loading');
        btn.disabled = true;

        const tier = waitlistData.tier || 'core';
        const email = currentUser.email;

        try {
            // Create payment order
            const createResponse = await fetch('/api/create-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, tier })
            });

            if (!createResponse.ok) {
                throw new Error('Failed to create payment order');
            }

            const orderData = await createResponse.json();

            // Open Razorpay checkout
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'ZapNest',
                description: `${capitalizeFirst(tier)} Subscription`,
                order_id: orderData.order_id,
                prefill: {
                    email: email
                },
                notes: orderData.notes,
                theme: {
                    color: '#00FF88'
                },
                modal: {
                    ondismiss: function () {
                        btn.classList.remove('loading');
                        btn.disabled = false;
                    }
                },
                handler: async function (response) {
                    // Verify payment
                    try {
                        const verifyResponse = await fetch('/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                email: email,
                                tier: tier
                            })
                        });

                        if (!verifyResponse.ok) {
                            throw new Error('Payment verification failed');
                        }

                        const result = await verifyResponse.json();

                        // Success! Show celebration and reload
                        showToast('🎉 Payment Successful!', 'Your subscription is now active. Welcome to ZapNest!');

                        // Reload page after 2 seconds to show subscriber state
                        setTimeout(() => {
                            window.location.reload();
                        }, 2500);

                    } catch (verifyError) {
                        console.error('[Payment] Verification error:', verifyError);
                        showToast('Verification Failed', 'Payment received but verification failed. Please contact support.', true);
                    }

                    btn.classList.remove('loading');
                    btn.disabled = false;
                }
            };

            const rzp = new Razorpay(options);

            rzp.on('payment.failed', function (response) {
                console.error('[Payment] Failed:', response.error);
                showToast('Payment Failed', response.error.description || 'Please try again', true);
                btn.classList.remove('loading');
                btn.disabled = false;
            });

            rzp.open();

        } catch (error) {
            console.error('[Payment] Error:', error);
            showToast('Error', 'Failed to start payment. Please try again.', true);
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    // ============================================
    // Utilities
    // ============================================

    function capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ============================================
    // Initialization
    // ============================================

    function init() {
        // Event listeners
        if (elements.loginForm) {
            elements.loginForm.addEventListener('submit', handleLoginSubmit);
        }

        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', logout);
        }

        elements.navItems.forEach(item => {
            item.addEventListener('click', handleNavClick);
        });

        // Also handle links within sections
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', handleNavClick);
        });

        if (elements.copyCodeBtn) {
            elements.copyCodeBtn.addEventListener('click', handleCopyCode);
        }

        // Address form
        if (elements.addressForm) {
            elements.addressForm.addEventListener('submit', handleAddressSubmit);
        }

        // Payment button
        if (elements.completeSubscriptionBtn) {
            elements.completeSubscriptionBtn.addEventListener('click', handlePayment);
        }

        // Action buttons - open modals
        if (elements.changeTierBtn) {
            elements.changeTierBtn.addEventListener('click', () => {
                // Pre-select current tier
                if (waitlistData && waitlistData.tier) {
                    const radio = document.querySelector(`input[name="modal-tier"][value="${waitlistData.tier}"]`);
                    if (radio) radio.checked = true;
                }
                openModal(elements.modalChangeTier);
            });
        }

        if (elements.pauseBtn) {
            elements.pauseBtn.addEventListener('click', () => openModal(elements.modalPause));
        }

        if (elements.cancelSubBtn) {
            elements.cancelSubBtn.addEventListener('click', () => openModal(elements.modalCancel));
        }

        // Modal confirm buttons
        if (elements.confirmTierChange) {
            elements.confirmTierChange.addEventListener('click', handleTierChange);
        }

        if (elements.confirmPause) {
            elements.confirmPause.addEventListener('click', handlePause);
        }

        if (elements.confirmCancel) {
            elements.confirmCancel.addEventListener('click', handleCancelConfirm);
        }

        // Modal close buttons
        document.querySelectorAll('.member-modal__close, [data-close-modal]').forEach(btn => {
            btn.addEventListener('click', closeAllModals);
        });

        // Close modal on backdrop click
        document.querySelectorAll('.member-modal__backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', closeAllModals);
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAllModals();
        });

        // Toast close
        const toastClose = document.querySelector('.member-toast__close');
        if (toastClose) {
            toastClose.addEventListener('click', () => {
                if (elements.toast) elements.toast.hidden = true;
            });
        }

        // Check URL hash for section
        if (window.location.hash && currentUser) {
            const section = window.location.hash.slice(1);
            const validSections = ['dashboard', 'orders', 'subscription', 'referrals', 'settings'];
            if (validSections.includes(section)) {
                showSection(section);
            }
        }

        // Check auth
        checkAuth();

        console.log('[ZapNest] Member dashboard initialized');
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
