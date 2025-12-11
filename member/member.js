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

        // Stats
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
        copyCodeBtn: document.getElementById('copy-code-btn')
    };

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

            // In production, this would send an email via backend
            // For now, we'll show the link in console (dev mode)
            const magicLink = `${window.location.origin}/member/?token=${token}&email=${encodeURIComponent(email)}`;
            console.log('[ZapNest] Magic Link (dev mode):', magicLink);

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

    function showWaitlistState() {
        elements.statTier.textContent = 'Pending';
        elements.statStatus.textContent = 'Waitlist';
        elements.statBilling.textContent = 'Jan 2025';

        // Show message about payment
        const nextBox = document.querySelector('.member-next-box__subtitle');
        if (nextBox) {
            nextBox.textContent = 'Complete payment to activate your subscription';
        }
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
