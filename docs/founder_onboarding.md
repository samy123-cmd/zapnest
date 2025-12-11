# ZapNest Founder Onboarding Sequence

## Overview

This document defines the complete journey from signup to first box delivery.

---

## Phase 1: Signup (Day 0)

### Trigger: Email submitted on landing page

**Immediate Actions:**
1. ✅ Store email in Supabase `subscribers` table
2. ✅ Assign founder position (001-500)
3. ✅ Send Welcome Email #1

**Email: Welcome #1**
- Subject: `You're in. Founder #{position} of 500 🎉`
- Content: Welcome, benefits overview, payment CTA

---

## Phase 2: Nurture (Days 1-7)

### If payment NOT completed:

**Day 1 — Welcome Email #2**
- Subject: `The "50 to 1" philosophy`
- Content: Testing process, quality standards

**Day 3 — Welcome Email #3**
- Subject: `Before we forget... ⏰`
- Content: Urgency, FAQ answers, payment reminder

**Day 7 — Nurture Email #1**
- Subject: `We saved your spot (but not forever)`
- Content: Direct ask, what they'll miss

**Day 10 — Nurture Email #2 (Final)**
- Subject: `Final call for founders 📣`
- Content: Last chance, no more emails after this

---

## Phase 3: Payment Complete (Day 0+)

### Trigger: Razorpay payment successful

**Immediate Actions:**
1. ✅ Update `subscribers.status` → `paid`
2. ✅ Create `orders` record
3. ✅ Generate referral code
4. ✅ Send Payment Confirmation email

**Email: Payment Confirmed**
- Subject: `Payment confirmed! You're officially a founder 🚀`
- Content: Order details, dashboard link, referral code

---

## Phase 4: Pre-Ship (7 days before ship date)

### Trigger: Ship date - 7 days

**Actions:**
1. Send Teaser Email
2. Generate shipping labels
3. Prepare QC checklist

**Email: Box Teaser**
- Subject: `Sneak peek: Your next box theme 👀`
- Content: Theme hint, ship date, referral reminder

---

## Phase 5: Shipping (Ship date)

### Trigger: Box shipped

**Actions:**
1. Update `orders.status` → `shipped`
2. Store tracking information
3. Send Shipping Notification

**Email: Shipped**
- Subject: `Your ZapNest box just shipped! 📦`
- Content: Tracking details, delivery estimate

---

## Phase 6: Post-Delivery (3-5 days after delivery)

### Trigger: Estimated delivery + 3 days

**Actions:**
1. Send Feedback Request email
2. Enable review in dashboard

**Email: Feedback Request**
- Subject: `How's your box? We'd love to know`
- Content: Feedback link, helps curate better

---

## Phase 7: Retention (Ongoing)

### Monthly Cycle:
- **Day 25:** Next box teaser
- **Day 1:** Billing reminder (if needed)
- **Day 10-15:** Box ships
- **Day 15-20:** Delivery + feedback

### Cancellation Intent:
**Trigger:** User clicks cancel in dashboard

**Email: Retention**
- Subject: `Before you go...`
- Content: Win-back offers, pause option, tier downgrade

---

## Email Timing Summary

| Day | Email | Trigger |
|-----|-------|---------|
| 0 | Welcome #1 | Signup |
| 1 | Welcome #2 | Timer |
| 3 | Welcome #3 | Timer |
| 0* | Payment Confirmed | Payment |
| 7 | Nurture #1 | No payment |
| 10 | Nurture #2 (Final) | No payment |
| Ship-7 | Teaser | Timer |
| Ship | Shipped | Status change |
| Ship+5 | Feedback | Timer |
| 25 | Next Box Teaser | Timer |

---

## Technical Implementation

### Supabase Edge Functions

Create scheduled functions for:
- `send_nurture_emails` — runs daily at 10am IST
- `send_teaser_emails` — runs 7 days before ship date
- `send_feedback_emails` — runs 5 days after delivery

### Resend Integration

All emails use Resend API with:
- From: `ZapNest <hello@zapneststore.in>`
- Reply-To: `hello@zapneststore.in`

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Signup → Payment Conversion | >50% |
| Email Open Rate | >40% |
| Email Click Rate | >15% |
| Post-Delivery Feedback | >30% |
| 30-Day Retention | >90% |
