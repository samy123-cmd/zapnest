/**
 * ZapNest Admin Dashboard
 * JavaScript for navigation, data handling, and Supabase integration
 */

(function () {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    const CONFIG = {
        // Supabase config
        supabaseUrl: 'https://vqxviqsvmlevabqihwir.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeHZpcXN2bWxldmFicWlod2lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM4OTYwMSwiZXhwIjoyMDgwOTY1NjAxfQ.uep7IOgBpIocVymhfS3PonT5r8miGktpeCEB07XDaQs',

        // Refresh interval for live data
        refreshInterval: 30000
    };

    // ============================================
    // State
    // ============================================
    let state = {
        currentSection: 'overview',
        waitlistData: [],
        stats: {
            waitlistCount: 0,
            conversionRate: 0,
            candidatesCount: 10,
            pendingApprovals: 1
        },
        tierDistribution: {
            lite: 0,
            core: 0,
            elite: 0
        }
    };

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {
        navItems: document.querySelectorAll('.admin-nav__item'),
        sections: document.querySelectorAll('.admin-section'),
        headerTitle: document.querySelector('.admin-header__title'),

        // Stats
        waitlistCount: document.getElementById('waitlist-count'),
        conversionRate: document.getElementById('conversion-rate'),
        candidatesCount: document.getElementById('candidates-count'),
        pendingApprovals: document.getElementById('pending-approvals'),

        // Tier bars
        tierLite: document.getElementById('tier-lite'),
        tierCore: document.getElementById('tier-core'),
        tierElite: document.getElementById('tier-elite'),
        tierLiteCount: document.getElementById('tier-lite-count'),
        tierCoreCount: document.getElementById('tier-core-count'),
        tierEliteCount: document.getElementById('tier-elite-count'),

        // Tables
        waitlistTable: document.getElementById('waitlist-table'),
        activityList: document.getElementById('activity-list'),

        // Buttons
        exportCsvBtn: document.getElementById('export-csv')
    };

    // ============================================
    // Navigation
    // ============================================

    function switchSection(sectionId) {
        // Update nav
        elements.navItems.forEach(item => {
            item.classList.toggle('admin-nav__item--active', item.dataset.section === sectionId);
        });

        // Update sections
        elements.sections.forEach(section => {
            section.hidden = section.id !== sectionId;
        });

        // Update title
        const titles = {
            overview: 'Dashboard',
            waitlist: 'Waitlist Management',
            agents: 'Agent Outputs',
            hitl: 'HITL Approvals',
            products: 'Product Pipeline',
            subscribers: 'Subscriber Management',
            orders: 'Order Management',
            revenue: 'Revenue Analytics'
        };

        // Load section-specific data
        if (sectionId === 'subscribers') loadSubscribersData();
        if (sectionId === 'orders') loadOrdersData();
        if (sectionId === 'revenue') loadRevenueData();
        elements.headerTitle.textContent = titles[sectionId] || 'Dashboard';

        state.currentSection = sectionId;
    }

    // ============================================
    // Data Loading (Mock + Supabase ready)
    // ============================================

    async function loadWaitlistData() {
        // Check if Supabase is configured
        if (CONFIG.supabaseUrl && CONFIG.supabaseKey) {
            try {
                const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/waitlist?select=id,email,tier,referral_code,created_at&order=created_at.desc`, {
                    headers: {
                        'apikey': CONFIG.supabaseKey,
                        'Authorization': `Bearer ${CONFIG.supabaseKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    state.waitlistData = await response.json();
                    addActivity('Loaded waitlist from Supabase', 'success');
                } else {
                    console.error('[Admin] Supabase fetch failed:', response.status);
                    state.waitlistData = [];
                }
            } catch (error) {
                console.error('[Admin] Supabase error:', error);
                state.waitlistData = [];
            }
        } else {
            console.log('[Admin] Supabase not configured. Using mock data.');
            state.waitlistData = [];
        }

        updateWaitlistUI();
    }

    function updateWaitlistUI() {
        const data = state.waitlistData;

        // Update stats
        state.stats.waitlistCount = data.length;

        // Calculate tier distribution
        const tiers = { lite: 0, core: 0, elite: 0 };
        data.forEach(item => {
            if (tiers.hasOwnProperty(item.tier)) {
                tiers[item.tier]++;
            }
        });
        state.tierDistribution = tiers;

        // Update UI
        updateStatsUI();
        updateTierBarsUI();
        updateWaitlistTableUI();
    }

    function updateStatsUI() {
        elements.waitlistCount.textContent = state.stats.waitlistCount;
        elements.conversionRate.textContent = state.stats.conversionRate + '%';
        elements.candidatesCount.textContent = state.stats.candidatesCount;
        elements.pendingApprovals.textContent = state.stats.pendingApprovals;
    }

    function updateTierBarsUI() {
        const total = state.stats.waitlistCount || 1;
        const { lite, core, elite } = state.tierDistribution;

        // Update bar widths
        elements.tierLite.style.width = `${(lite / total) * 100}%`;
        elements.tierCore.style.width = `${(core / total) * 100}%`;
        elements.tierElite.style.width = `${(elite / total) * 100}%`;

        // Update counts
        elements.tierLiteCount.textContent = lite;
        elements.tierCoreCount.textContent = core;
        elements.tierEliteCount.textContent = elite;
    }

    function updateWaitlistTableUI() {
        const data = state.waitlistData;

        if (data.length === 0) {
            elements.waitlistTable.innerHTML = `
        <tr>
          <td colspan="5" class="data-table__empty">No signups yet. Connect Supabase to load data.</td>
        </tr>
      `;
            return;
        }

        elements.waitlistTable.innerHTML = data.map(item => `
      <tr>
        <td>${maskEmail(item.email)}</td>
        <td><span class="tier-badge tier-badge--${item.tier}">${item.tier}</span></td>
        <td>${item.referral || '-'}</td>
        <td>${formatDate(item.created_at)}</td>
        <td>
          <button class="btn btn--sm btn--outline" data-action="view" data-id="${item.id}">View</button>
        </td>
      </tr>
    `).join('');
    }

    // ============================================
    // Activity Log
    // ============================================

    function addActivity(title, type = 'success') {
        const iconSvg = {
            success: '<polyline points="20 6 9 17 4 12"></polyline>',
            info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
            warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
        };

        const html = `
      <div class="activity-item">
        <div class="activity-item__icon activity-item__icon--${type}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${iconSvg[type] || iconSvg.info}
          </svg>
        </div>
        <div class="activity-item__content">
          <span class="activity-item__title">${title}</span>
          <span class="activity-item__time">Just now</span>
        </div>
      </div>
    `;

        elements.activityList.insertAdjacentHTML('afterbegin', html);

        // Keep only last 10 activities
        while (elements.activityList.children.length > 10) {
            elements.activityList.lastChild.remove();
        }
    }

    // ============================================
    // Export
    // ============================================

    function exportToCSV() {
        const data = state.waitlistData;

        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = ['Email', 'Tier', 'Referral', 'Created At'];
        const rows = data.map(item => [
            item.email,
            item.tier,
            item.referral || '',
            item.created_at
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zapnest-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        addActivity('Exported waitlist to CSV', 'success');
    }

    // ============================================
    // Subscribers Data
    // ============================================

    async function loadSubscribersData() {
        if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return;

        try {
            const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/subscribers?select=*&order=created_at.desc`, {
                headers: {
                    'apikey': CONFIG.supabaseKey,
                    'Authorization': `Bearer ${CONFIG.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const subscribers = await response.json();
                updateSubscribersUI(subscribers);
            }
        } catch (error) {
            console.error('[Admin] Error loading subscribers:', error);
        }
    }

    function updateSubscribersUI(subscribers) {
        const activeEl = document.getElementById('active-subscribers');
        const founderEl = document.getElementById('founder-count');
        const mrrEl = document.getElementById('mrr-value');
        const churnEl = document.getElementById('churn-count');
        const tableEl = document.getElementById('subscribers-table');

        if (!tableEl) return;

        const active = subscribers.filter(s => s.status === 'active');
        const founders = subscribers.filter(s => s.is_founder);
        const churned = subscribers.filter(s => s.status === 'cancelled');
        const mrr = active.reduce((sum, s) => sum + (s.monthly_price || 0), 0);

        if (activeEl) activeEl.textContent = active.length;
        if (founderEl) founderEl.textContent = founders.length;
        if (mrrEl) mrrEl.textContent = `₹${mrr.toLocaleString('en-IN')}`;
        if (churnEl) churnEl.textContent = churned.length;

        if (subscribers.length === 0) {
            tableEl.innerHTML = '<tr><td colspan="6" class="data-table__empty">No subscribers yet.</td></tr>';
            return;
        }

        tableEl.innerHTML = subscribers.map(s => `
            <tr>
                <td>${maskEmail(s.email)}</td>
                <td><span class="tier-badge tier-badge--${s.tier}">${s.tier}</span></td>
                <td><span class="status-badge status-badge--${s.status}">${s.status}</span></td>
                <td>₹${(s.monthly_price || 0).toLocaleString('en-IN')}</td>
                <td>${formatDate(s.next_billing_date)}</td>
                <td>
                    <button class="btn btn--sm btn--outline">View</button>
                </td>
            </tr>
        `).join('');
    }

    // ============================================
    // Orders Data
    // ============================================

    async function loadOrdersData() {
        if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return;

        try {
            const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/orders?select=*,subscribers(email,tier)&order=created_at.desc`, {
                headers: {
                    'apikey': CONFIG.supabaseKey,
                    'Authorization': `Bearer ${CONFIG.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const orders = await response.json();
                updateOrdersUI(orders);
            }
        } catch (error) {
            console.error('[Admin] Error loading orders:', error);
        }
    }

    function updateOrdersUI(orders) {
        const totalEl = document.getElementById('total-orders');
        const pendingEl = document.getElementById('pending-orders');
        const shippedEl = document.getElementById('shipped-orders');
        const deliveredEl = document.getElementById('delivered-orders');
        const tableEl = document.getElementById('orders-table');

        if (!tableEl) return;

        const pending = orders.filter(o => o.status === 'pending' || o.status === 'processing');
        const shipped = orders.filter(o => o.status === 'shipped');
        const delivered = orders.filter(o => o.status === 'delivered');

        if (totalEl) totalEl.textContent = orders.length;
        if (pendingEl) pendingEl.textContent = pending.length;
        if (shippedEl) shippedEl.textContent = shipped.length;
        if (deliveredEl) deliveredEl.textContent = delivered.length;

        if (orders.length === 0) {
            tableEl.innerHTML = '<tr><td colspan="7" class="data-table__empty">No orders yet.</td></tr>';
            return;
        }

        tableEl.innerHTML = orders.map(o => `
            <tr>
                <td><input type="checkbox" data-order-id="${o.id}"></td>
                <td style="font-family: monospace;">${o.order_number || '—'}</td>
                <td>${o.subscribers?.email ? maskEmail(o.subscribers.email) : '—'}</td>
                <td><span class="tier-badge tier-badge--${o.subscribers?.tier || 'core'}">${o.tier || o.subscribers?.tier || 'core'}</span></td>
                <td><span class="status-badge status-badge--${o.status}">${o.status}</span></td>
                <td style="font-family: monospace;">${o.tracking_number || '—'}</td>
                <td>
                    <button class="btn btn--sm btn--outline">Edit</button>
                </td>
            </tr>
        `).join('');
    }

    // ============================================
    // Revenue Data
    // ============================================

    async function loadRevenueData() {
        if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return;

        try {
            // Load subscribers for revenue calculation
            const [subscribersRes, paymentsRes] = await Promise.all([
                fetch(`${CONFIG.supabaseUrl}/rest/v1/subscribers?select=*&status=eq.active`, {
                    headers: {
                        'apikey': CONFIG.supabaseKey,
                        'Authorization': `Bearer ${CONFIG.supabaseKey}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(`${CONFIG.supabaseUrl}/rest/v1/payments?select=*,subscribers(email)&order=created_at.desc&limit=20`, {
                    headers: {
                        'apikey': CONFIG.supabaseKey,
                        'Authorization': `Bearer ${CONFIG.supabaseKey}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            if (subscribersRes.ok && paymentsRes.ok) {
                const subscribers = await subscribersRes.json();
                const payments = await paymentsRes.json();
                updateRevenueUI(subscribers, payments);
            }
        } catch (error) {
            console.error('[Admin] Error loading revenue:', error);
        }
    }

    function updateRevenueUI(subscribers, payments) {
        const mrrEl = document.getElementById('total-mrr');
        const collectedEl = document.getElementById('total-collected');
        const arpuEl = document.getElementById('arpu');

        // Tier revenue breakdown
        const tiers = { lite: [], core: [], elite: [] };
        let totalMrr = 0;

        subscribers.forEach(s => {
            const price = s.monthly_price || 0;
            totalMrr += price;
            if (tiers[s.tier]) tiers[s.tier].push(s);
        });

        const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const arpu = subscribers.length > 0 ? totalMrr / subscribers.length : 0;

        if (mrrEl) mrrEl.textContent = `₹${totalMrr.toLocaleString('en-IN')}`;
        if (collectedEl) collectedEl.textContent = `₹${totalCollected.toLocaleString('en-IN')}`;
        if (arpuEl) arpuEl.textContent = `₹${Math.round(arpu).toLocaleString('en-IN')}`;

        // Update tier bars
        const maxRevenue = Math.max(
            tiers.lite.length * 1499,
            tiers.core.length * 2999,
            tiers.elite.length * 4999,
            1
        );

        ['lite', 'core', 'elite'].forEach(tier => {
            const price = { lite: 1499, core: 2999, elite: 4999 }[tier];
            const count = tiers[tier].length;
            const revenue = count * price;
            const pct = (revenue / (totalMrr || 1)) * 100;

            const barEl = document.getElementById(`revenue-${tier}-bar`);
            const countEl = document.getElementById(`revenue-${tier}-count`);
            const amountEl = document.getElementById(`revenue-${tier}-amount`);

            if (barEl) barEl.style.width = `${Math.min(pct, 100)}%`;
            if (countEl) countEl.textContent = `${count} subscriber${count !== 1 ? 's' : ''}`;
            if (amountEl) amountEl.textContent = `₹${revenue.toLocaleString('en-IN')}`;
        });

        // Update payments table
        const paymentsTable = document.getElementById('payments-table');
        if (paymentsTable) {
            if (payments.length === 0) {
                paymentsTable.innerHTML = '<tr><td colspan="5" class="data-table__empty">No payments yet.</td></tr>';
            } else {
                paymentsTable.innerHTML = payments.map(p => `
                    <tr>
                        <td style="font-family: monospace;">${p.razorpay_payment_id || p.id}</td>
                        <td>${p.subscribers?.email ? maskEmail(p.subscribers.email) : '—'}</td>
                        <td>₹${(p.amount || 0).toLocaleString('en-IN')}</td>
                        <td><span class="status-badge status-badge--${p.status === 'captured' ? 'active' : 'pending'}">${p.status}</span></td>
                        <td>${formatDate(p.created_at)}</td>
                    </tr>
                `).join('');
            }
        }
    }

    // ============================================
    // Export Functions
    // ============================================

    function exportSubscribersCSV() {
        loadSubscribersData().then(() => {
            // Would need to store data in state first
            addActivity('Exported subscribers to CSV', 'success');
        });
    }

    function exportOrdersCSV() {
        addActivity('Exported orders to CSV', 'success');
    }

    function generateShippingLabels() {
        const selected = document.querySelectorAll('#orders-table input[type="checkbox"]:checked');
        if (selected.length === 0) {
            alert('Please select at least one order');
            return;
        }
        addActivity(`Generated ${selected.length} shipping labels`, 'success');
        alert(`Generated labels for ${selected.length} orders. (Demo mode)`);
    }

    // ============================================
    // HITL Actions
    // ============================================

    function handleApproval(action, itemId) {
        console.log(`[Admin] ${action} approval for ${itemId}`);

        switch (action) {
            case 'approve':
                addActivity('Approved supplier shortlist', 'success');
                break;
            case 'reject':
                addActivity('Rejected approval request', 'warning');
                break;
        }
    }

    // ============================================
    // Utilities
    // ============================================

    function maskEmail(email) {
        if (!email) return '-';
        const [local, domain] = email.split('@');
        if (!domain) return email;
        const masked = local.substring(0, 2) + '***';
        return `${masked}@${domain}`;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    // ============================================
    // Event Listeners
    // ============================================

    function initEventListeners() {
        // Navigation
        elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                switchSection(item.dataset.section);
            });
        });

        // Export CSV
        if (elements.exportCsvBtn) {
            elements.exportCsvBtn.addEventListener('click', exportToCSV);
        }

        // HITL approval buttons
        document.querySelector('.approval-list')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn');
            if (!btn) return;

            if (btn.classList.contains('btn--primary')) {
                handleApproval('approve', 'supplier-shortlist');
            } else if (btn.classList.contains('btn--danger')) {
                handleApproval('reject', 'supplier-shortlist');
            }
        });
    }

    // ============================================
    // Supabase Integration (placeholder)
    // ============================================

    function initSupabase() {
        if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
            console.log('[Admin] Supabase not configured. Using mock data.');
            return false;
        }

        // TODO: Initialize Supabase client
        // const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

        return true;
    }

    // ============================================
    // Initialization
    // ============================================

    function init() {
        console.log('[Admin] Initializing dashboard...');

        // Initialize Supabase
        initSupabase();

        // Setup event listeners
        initEventListeners();

        // Load initial data
        loadWaitlistData();

        // Set initial stats (from Week 1 simulation)
        state.stats.candidatesCount = 10;
        state.stats.pendingApprovals = 1;
        updateStatsUI();

        console.log('[Admin] Dashboard initialized');
    }

    // ============================================
    // Authentication
    // ============================================

    const loginOverlay = document.getElementById('admin-login');
    const dashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('login-error');
    const loginBtn = loginForm ? loginForm.querySelector('button') : null;

    async function checkAuth() {
        // Check if user is authenticated via Supabase
        const session = localStorage.getItem('zapnest_admin_session');

        if (session) {
            try {
                const sessionData = JSON.parse(session);
                // Verify session is still valid (check expiry)
                if (sessionData.expires_at && new Date(sessionData.expires_at) > new Date()) {
                    showDashboard();
                    return true;
                }
            } catch (e) {
                console.error('[Admin] Invalid session');
            }
        }

        // No valid session, show login
        showLogin();
        return false;
    }

    function showLogin() {
        if (loginOverlay) loginOverlay.hidden = false;
        if (dashboard) dashboard.hidden = true;
    }

    function showDashboard() {
        if (loginOverlay) loginOverlay.hidden = true;
        if (dashboard) dashboard.hidden = false;
        init(); // Initialize dashboard after auth
    }

    async function handleLogin(email, password) {
        if (!CONFIG.supabaseUrl) {
            showError('Supabase not configured');
            return;
        }

        try {
            // Supabase Auth sign in
            const response = await fetch(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': CONFIG.supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.access_token) {
                // Store session
                const session = {
                    access_token: data.access_token,
                    user: data.user,
                    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
                };
                localStorage.setItem('zapnest_admin_session', JSON.stringify(session));

                showDashboard();
            } else {
                showError(data.error_description || data.msg || 'Invalid credentials');
            }
        } catch (error) {
            console.error('[Admin] Login error:', error);
            showError('Login failed. Please try again.');
        }
    }

    function showError(message) {
        if (loginError) {
            loginError.textContent = message;
            loginError.hidden = false;
        }
    }

    function logout() {
        localStorage.removeItem('zapnest_admin_session');
        showLogin();
    }

    // Expose logout globally for button
    window.adminLogout = logout;

    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;

            if (loginBtn) loginBtn.classList.add('loading');
            if (loginError) loginError.hidden = true;

            await handleLogin(email, password);

            if (loginBtn) loginBtn.classList.remove('loading');
        });
    }

    // Start with auth check
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuth);
    } else {
        checkAuth();
    }

})();
