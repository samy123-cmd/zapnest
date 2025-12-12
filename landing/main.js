/**
 * ZapNest Black Box - Founders Landing Page
 * Main JavaScript - Modal, Form, Analytics
 */

(function () {
  'use strict';

  // ============================================
  // Configuration
  // ============================================
  const CONFIG = {
    scrollThreshold: 500,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    apiEndpoint: '/api/waitlist',
    analyticsEnabled: true
  };

  // ============================================
  // DOM Elements
  // ============================================
  const elements = {
    modal: document.getElementById('founders-modal'),
    modalFormState: document.getElementById('modal-form-state'),
    modalSuccessState: document.getElementById('modal-success-state'),
    form: document.getElementById('founders-form'),
    emailInput: document.getElementById('email'),
    emailError: document.getElementById('email-error'),
    consentInput: document.getElementById('consent'),
    consentError: document.getElementById('consent-error'),
    submitBtn: document.getElementById('submit-btn'),
    formError: document.getElementById('form-error'),
    stickyCta: document.getElementById('sticky-cta'),
    modalTriggers: document.querySelectorAll('[data-modal-trigger]'),
    modalCloseButtons: document.querySelectorAll('[data-modal-close]'),
    // Mobile menu
    menuToggle: document.getElementById('menu-toggle'),
    mobileNav: document.getElementById('mobile-nav')
  };

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * SHA-256 hash for email (privacy-first analytics)
   */
  async function hashEmail(email) {
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate email format
   */
  function isValidEmail(email) {
    return CONFIG.emailRegex.test(email);
  }

  /**
   * Get selected tier from form
   */
  function getSelectedTier() {
    const selected = elements.form.querySelector('input[name="tier"]:checked');
    return selected ? selected.value : 'core';
  }

  /**
   * Track GA4 event
   */
  function trackEvent(eventName, params = {}) {
    if (!CONFIG.analyticsEnabled) return;

    // Only fire if gtag is available and consent is given
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }

    // Console log for development
    console.log('[Analytics]', eventName, params);
  }

  // ============================================
  // Modal Functions
  // ============================================

  /**
   * Open modal with focus trap
   */
  function openModal(tier = 'core') {
    // Set default tier if provided
    if (tier) {
      const tierRadio = elements.form.querySelector(`input[name="tier"][value="${tier}"]`);
      if (tierRadio) tierRadio.checked = true;
    }

    // Show modal
    elements.modal.hidden = false;
    document.body.style.overflow = 'hidden';

    // Focus first input
    setTimeout(() => {
      elements.emailInput.focus();
    }, 100);

    // Track modal open
    trackEvent('modal_open', {
      source_cta: 'modal_trigger',
      tier: tier
    });
  }

  /**
   * Close modal
   */
  function closeModal() {
    elements.modal.hidden = true;
    document.body.style.overflow = '';

    // Reset form state
    resetForm();
  }

  /**
   * Reset form to initial state
   */
  function resetForm() {
    elements.form.reset();
    elements.modalFormState.hidden = false;
    elements.modalSuccessState.hidden = true;
    elements.emailInput.classList.remove('error');
    elements.formError.classList.remove('visible');
    elements.submitBtn.classList.remove('loading');

    // Reset to Core tier
    const coreTier = elements.form.querySelector('input[name="tier"][value="core"]');
    if (coreTier) coreTier.checked = true;
  }

  /**
   * Show success state
   */
  function showSuccess(isExistingUser = false) {
    elements.modalFormState.hidden = true;
    elements.modalSuccessState.hidden = false;

    // Update message for existing users
    const successTitle = elements.modalSuccessState.querySelector('h2');
    const successMsg = elements.modalSuccessState.querySelector('p');

    if (isExistingUser && successTitle && successMsg) {
      successTitle.textContent = "Welcome Back! 👋";
      successMsg.textContent = "You're already on our founders list. We'll send you updates and payment info soon!";
    }
  }

  // ============================================
  // Form Validation
  // ============================================

  /**
   * Validate form fields
   */
  function validateForm() {
    let isValid = true;

    // Email validation
    const email = elements.emailInput.value.trim();
    if (!email || !isValidEmail(email)) {
      elements.emailInput.classList.add('error');
      isValid = false;
    } else {
      elements.emailInput.classList.remove('error');
    }

    // Consent validation
    if (!elements.consentInput.checked) {
      elements.consentError.style.display = 'block';
      isValid = false;
    } else {
      elements.consentError.style.display = 'none';
    }

    return isValid;
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(e) {
    e.preventDefault();

    // Validate
    if (!validateForm()) {
      trackEvent('form_error', { error_type: 'validation' });
      return;
    }

    // Get form data
    const email = elements.emailInput.value.trim();
    const tier = getSelectedTier();
    const referral = elements.form.querySelector('#referral').value.trim();
    const consent = elements.consentInput.checked;

    // Show loading state
    elements.submitBtn.classList.add('loading');
    elements.formError.classList.remove('visible');

    // Track submit attempt
    trackEvent('form_submit', {
      tier: tier,
      has_referral: !!referral,
      consent: consent
    });

    try {
      // Hash email for privacy-first analytics
      const emailHash = await hashEmail(email);

      // Simulate API call (replace with actual endpoint)
      const response = await submitToAPI({
        email: email,
        tier: tier,
        referral: referral,
        consent: consent,
        source: document.referrer || 'direct'
      });

      if (response.success) {
        // Check if user was already on waitlist
        if (response.alreadyOnWaitlist) {
          // Show friendly message for existing users
          trackEvent('form_existing_user', { email_hash: emailHash });
          showSuccess(true); // Pass flag to show alternate message
        } else {
          // New signup
          trackEvent('form_success', {
            tier: tier,
            email_hash: emailHash,
            referral_code: referral || null
          });

          // Fire marketing pixels only if consent is true
          if (consent) {
            fireMarketingPixels(tier, emailHash);
          }

          // Send welcome email via Edge Function (fire and forget)
          sendWelcomeEmail(email, tier).catch(err => {
            console.warn('[Email] Welcome email failed:', err);
          });

          // Show success state
          showSuccess(false);
        }
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);

      // Track error
      trackEvent('form_error', {
        error_type: 'server',
        tier: tier
      });

      // Show error message
      elements.formError.classList.add('visible');
    } finally {
      elements.submitBtn.classList.remove('loading');
    }
  }

  /**
   * Submit to Supabase API
   */
  async function submitToAPI(data) {
    // Get Supabase config from window
    const supabaseUrl = window.SUPABASE_URL;
    const supabaseKey = window.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[API] Supabase not configured');
      return { success: false, message: 'Server not configured' };
    }

    // Hash email for storage
    const emailHash = await hashEmail(data.email);

    const payload = {
      email: data.email,
      email_hash: emailHash,
      tier: data.tier,
      referral_code: data.referral || null,
      consent: data.consent,
      source: data.source || 'direct'
    };

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/waitlist`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[API] Signup successful');
        return { success: true, data: result };
      } else {
        const error = await response.json();
        console.error('[API] Error:', error);

        // Check for duplicate email - treat as success with special flag
        if (error.code === '23505') {
          return { success: true, alreadyOnWaitlist: true };
        }

        return { success: false, message: error.message || 'Signup failed' };
      }
    } catch (error) {
      console.error('[API] Network error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  /**
   * Fire marketing pixels (only after consent)
   */
  function fireMarketingPixels(tier, emailHash) {
    // Meta/Facebook Pixel
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', {
        content_name: 'founders_waitlist',
        tier: tier,
        email_hash: emailHash
      });
    }

    console.log('[Pixels] Marketing pixels fired (consent: true)');
  }

  /**
   * Send welcome email via Vercel API route
   */
  async function sendWelcomeEmail(email, tier) {
    try {
      const response = await fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, tier })
      });

      const result = await response.json();
      if (result.success) {
        console.log('[Email] Welcome email sent:', result.id);
      } else {
        console.warn('[Email] Failed to send:', result.error);
      }
    } catch (error) {
      console.error('[Email] Error:', error);
    }
  }

  // ============================================
  // Sticky CTA Logic
  // ============================================

  /**
   * Handle scroll for sticky CTA visibility
   */
  function handleScroll() {
    if (!elements.stickyCta) return;

    if (window.scrollY > CONFIG.scrollThreshold) {
      elements.stickyCta.classList.add('visible');
    } else {
      elements.stickyCta.classList.remove('visible');
    }
  }

  // ============================================
  // FAQ Accordion Analytics
  // ============================================

  /**
   * Track FAQ interactions
   */
  function handleFAQClick(e) {
    const details = e.target.closest('details');
    if (!details) return;

    const question = details.querySelector('.zn-faq__question');
    if (!question) return;

    const questionIndex = Array.from(document.querySelectorAll('.zn-faq__item')).indexOf(details);

    // Only track when opening
    if (!details.open) {
      trackEvent('faq_expand', {
        question_index: questionIndex,
        question_text: question.textContent.trim().substring(0, 50)
      });
    }
  }

  // ============================================
  // Event Listeners
  // ============================================

  function initEventListeners() {
    // Modal triggers
    elements.modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const tier = trigger.dataset.tier || 'core';
        openModal(tier);

        trackEvent('join_founders_click', {
          tier: tier,
          referrer: document.referrer,
          consent: false,
          source: trigger.id || 'unknown_cta'
        });
      });
    });

    // Modal close
    elements.modalCloseButtons.forEach(btn => {
      btn.addEventListener('click', closeModal);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !elements.modal.hidden) {
        closeModal();
      }
    });

    // Form submission
    if (elements.form) {
      elements.form.addEventListener('submit', handleSubmit);
    }

    // Real-time email validation
    if (elements.emailInput) {
      elements.emailInput.addEventListener('blur', () => {
        const email = elements.emailInput.value.trim();
        if (email && !isValidEmail(email)) {
          elements.emailInput.classList.add('error');
        } else {
          elements.emailInput.classList.remove('error');
        }
      });

      elements.emailInput.addEventListener('input', () => {
        elements.emailInput.classList.remove('error');
      });
    }

    // Consent checkbox
    if (elements.consentInput) {
      elements.consentInput.addEventListener('change', () => {
        if (elements.consentInput.checked) {
          elements.consentError.style.display = 'none';
        }
      });
    }

    // Scroll handler for sticky CTA
    window.addEventListener('scroll', handleScroll, { passive: true });

    // FAQ clicks
    document.querySelectorAll('.zn-faq__item').forEach(item => {
      item.addEventListener('click', handleFAQClick);
    });

    // Tier selection tracking
    elements.form.querySelectorAll('input[name="tier"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        trackEvent('tier_select', {
          tier: e.target.value,
          previous_tier: null
        });
      });
    });

    // Mobile menu toggle
    if (elements.menuToggle && elements.mobileNav) {
      elements.menuToggle.addEventListener('click', () => {
        const isOpen = !elements.mobileNav.hidden;
        elements.mobileNav.hidden = isOpen;
        elements.menuToggle.classList.toggle('active', !isOpen);
        elements.menuToggle.setAttribute('aria-expanded', !isOpen);
      });

      // Close menu when clicking a link
      elements.mobileNav.querySelectorAll('[data-close-menu]').forEach(link => {
        link.addEventListener('click', () => {
          elements.mobileNav.hidden = true;
          elements.menuToggle.classList.remove('active');
          elements.menuToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  // ============================================
  // Countdown Timer (FOMO)
  // ============================================

  function initCountdown() {
    // Target date: Feb 28, 2026 23:59:59 IST (First box ships)
    const targetDate = new Date('2026-02-28T23:59:59+05:30').getTime();

    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minutesEl = document.getElementById('countdown-minutes');
    const secondsEl = document.getElementById('countdown-seconds');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    function updateCountdown() {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        // Countdown ended
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      daysEl.textContent = String(days).padStart(2, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minutesEl.textContent = String(minutes).padStart(2, '0');
      secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // ============================================
  // Initialization
  // ============================================

  function init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initEventListeners();
        initCountdown();
      });
    } else {
      initEventListeners();
      initCountdown();
    }

    // Track page view
    trackEvent('page_view', {
      page: 'founders_landing',
      referrer: document.referrer
    });

    console.log('[ZapNest] Landing page initialized');
  }

  // Start
  init();

})();
