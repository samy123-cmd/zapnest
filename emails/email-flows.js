/**
 * ZapNest Email Flow Templates
 * Complete email sequences for founder engagement
 * 
 * Flows:
 * 1. Welcome Sequence (Post-signup)
 * 2. Payment Success
 * 3. Nurture Sequence (Pre-payment)
 * 4. Shipping Updates
 * 5. Retention & Win-back
 */

// ============================================
// Configuration
// ============================================

const EMAIL_FLOWS = {
    brand: {
        name: 'ZapNest',
        fromEmail: 'hello@zapneststore.in',
        replyTo: 'hello@zapneststore.in',
        website: 'https://zapneststore.in',
        color: '#00FF88',
        tagline: 'Tech That Earns Its Place'
    }
};

// ============================================
// 1. WELCOME SEQUENCE (Post-Signup)
// ============================================

const WELCOME_SEQUENCE = {
    name: 'welcome_sequence',
    trigger: 'signup_complete',
    emails: [
        {
            id: 'welcome_1',
            delay: '0min',
            subject: 'You\'re in. Founder #{position} of 500 🎉',
            preheader: 'Welcome to ZapNest Black Box — your tech journey starts here',
            body: `
# Welcome to ZapNest, {firstName}

You just claimed spot **#{position}** of 500 in our Founder's Circle.

This isn't just a subscription — it's a statement. You want tech that matters, not random gadgets collecting dust.

## What Happens Next

1. **Complete your payment** to lock in founder pricing forever
2. **First box ships** end of February 2025
3. **Get surprised** by curated tech you'll actually use

## Your Founder Benefits

- ✅ **Price-locked forever** — your rate never increases
- ✅ **First access** — get boxes before the public
- ✅ **Direct access** — reply to this email anytime

---

**Ready to lock in your spot?**

[Complete Payment →](https://zapneststore.in/payment/)

---

Questions? Just reply to this email.

— Team ZapNest
      `
        },
        {
            id: 'welcome_2',
            delay: '24h',
            subject: 'The "50 to 1" philosophy',
            preheader: 'Why 96% of products don\'t make it into ZapNest',
            body: `
# How we pick what goes in your box

Hey {firstName},

Every month, we test **50+ products**.

Only **1-2 make the cut**.

That's a 96% rejection rate. Here's why:

## Our Testing Process

1. **Source candidates** — scour Amazon, AliExpress, direct from manufacturers
2. **Order samples** — we buy, not accept free review units
3. **2-week testing** — daily use, not unboxing and forgetting
4. **Brutal scoring** — build quality, usefulness, design, value
5. **Final cut** — only products we'd buy with our own money

## What We Reject

❌ Gimmicky gadgets that break in a week
❌ "Cool" products you use once
❌ Cheap knockoffs of premium goods
❌ Anything with fake Amazon reviews

## What Makes It In

✅ Products that solve real problems
✅ Build quality that survives daily use
✅ Design that looks good on your desk
✅ Value that exceeds the price

---

**Your first box is being curated right now.**

[Lock in your spot →](https://zapneststore.in/payment/)

— Team ZapNest
      `
        },
        {
            id: 'welcome_3',
            delay: '72h',
            subject: 'Before we forget... ⏰',
            preheader: 'Only a few founder spots remain',
            body: `
# Quick reminder, {firstName}

You signed up for the Founder's Circle, but we haven't seen your payment yet.

That's okay — we get it. Life gets busy.

But here's the thing: **founder spots are filling up**.

Once we hit 500, the waitlist closes and prices go up.

## What you'll miss if you wait:

- 🔒 **Lifetime price lock** — gone after founders phase
- 📦 **February box** — ships to founders only
- 💎 **Founder perks** — exclusive community access

---

**3 minutes is all it takes:**

[Complete Payment Now →](https://zapneststore.in/payment/)

---

If you've changed your mind, no hard feelings. But if you're still interested, don't let this slip away.

— Team ZapNest
      `
        }
    ]
};

// ============================================
// 2. PAYMENT SUCCESS
// ============================================

const PAYMENT_SUCCESS = {
    name: 'payment_success',
    trigger: 'payment_complete',
    emails: [
        {
            id: 'payment_confirmed',
            delay: '0min',
            subject: 'Payment confirmed! You\'re officially a founder 🚀',
            preheader: 'Welcome to the ZapNest Founder\'s Circle',
            body: `
# It's official, {firstName}!

**Payment confirmed.** You're now Founder **#{position}** of 500.

## Your Order Details

- **Plan:** {tierName}
- **Amount:** ₹{amount}
- **Billing:** Monthly, starting {billingDate}
- **First box ships:** End of February 2025

## Your Founder Dashboard

Track your subscription, update shipping details, and grab your referral code:

[Go to Dashboard →](https://zapneststore.in/member/)

## Your Referral Code

Share this with friends and you'll both get ₹200:

**{referralCode}**

---

## What's Next?

1. **Now:** Explore your dashboard, share your referral
2. **February:** Box gets packed and shipped
3. **Delivery:** Unbox, enjoy, repeat monthly

---

Get pumped. Your first curated tech surprise is coming.

— Team ZapNest
      `
        }
    ]
};

// ============================================
// 3. NURTURE SEQUENCE (Pre-payment reminders)
// ============================================

const NURTURE_SEQUENCE = {
    name: 'nurture_sequence',
    trigger: 'signup_no_payment_7d',
    emails: [
        {
            id: 'nurture_1',
            delay: '0min',
            subject: 'We saved your spot (but not forever)',
            preheader: 'Complete your payment before {expiryDate}',
            body: `
# Still thinking about it, {firstName}?

You signed up {daysAgo} days ago but haven't completed payment yet.

We get it — commitment is hard. But here's what you're leaving on the table:

## Founder Benefits You'll Lose

- Price lock at ₹{tierPrice}/month (regular price: ₹{regularPrice})
- First access to February's curated box
- Lifetime founder status and perks

## Still Have Questions?

**"What if I don't like the product?"**
→ 30-day satisfaction guarantee. We'll make it right.

**"Can I cancel anytime?"**
→ Yes. Cancel before the 5th of any month. No fees.

**"When does the first box ship?"**
→ End of February 2025 for founders.

---

[Complete Your Payment →](https://zapneststore.in/payment/)

— Team ZapNest
      `
        },
        {
            id: 'nurture_2',
            delay: '3d',
            subject: 'Final call for founders 📣',
            preheader: 'Last chance to lock in your spot',
            body: `
# This is it, {firstName}.

We're about to hit 500 founders and close the waitlist.

After that:
- Prices go up
- Wait times increase
- Founder perks disappear

**I won't email you again about this.** If you're interested, now's the time.

[Lock In My Spot →](https://zapneststore.in/payment/)

If you're not interested, no worries — thanks for checking us out.

— Team ZapNest
      `
        }
    ]
};

// ============================================
// 4. SHIPPING UPDATES
// ============================================

const SHIPPING_SEQUENCE = {
    name: 'shipping_sequence',
    trigger: 'box_shipped',
    emails: [
        {
            id: 'shipping_1',
            delay: '0min',
            subject: 'Your ZapNest box just shipped! 📦',
            preheader: 'Track your delivery',
            body: `
# It's on the way, {firstName}!

Your ZapNest Black Box has been dispatched.

## Tracking Details

- **Carrier:** {carrier}
- **Tracking ID:** {trackingId}
- **Estimated Delivery:** {estimatedDate}

[Track Your Package →]({trackingUrl})

## Pro Tips

- 📸 **Unbox on camera** — share with #ZapNest500
- ⭐ **Rate your box** — helps us curate better
- 🔗 **Share your code** — earn ₹200 per referral

---

Get excited. Something good is on the way.

— Team ZapNest
      `
        },
        {
            id: 'shipping_2',
            delay: '5d',
            subject: 'How\'s your box? We\'d love to know',
            preheader: 'Quick feedback helps us curate better',
            body: `
# Hey {firstName}, how'd we do?

You've had your box for a few days now. We'd love your honest feedback.

**Rate your experience (takes 30 seconds):**

[⭐ Give Feedback →](https://zapneststore.in/feedback/)

## This helps us:

- Curate better products for you
- Fix any quality issues fast
- Understand what you love

---

Your opinion shapes what goes in next month's box.

— Team ZapNest
      `
        }
    ]
};

// ============================================
// 5. RETENTION & WIN-BACK
// ============================================

const RETENTION_SEQUENCE = {
    name: 'retention_sequence',
    trigger: 'cancellation_intent',
    emails: [
        {
            id: 'retention_1',
            delay: '0min',
            subject: 'Before you go...',
            preheader: 'Is there something we can fix?',
            body: `
# Hey {firstName},

We noticed you're thinking about canceling.

That's okay — we'd rather you go happy than stay frustrated.

But before you do, can we try to fix it?

## Common Issues We Can Solve

**"The products aren't for me"**
→ Tell us what you'd prefer. We'll consider it for future curation.

**"It's too expensive"**
→ Switch to Lite tier at ₹1,599/month.

**"I'm just taking a break"**
→ Pause your subscription instead of canceling.

---

**Want to chat?** Reply to this email. Real humans answer.

Or if you're sure:

[Continue with Cancellation →](https://zapneststore.in/member/cancel)

No hard feelings either way.

— Team ZapNest
      `
        }
    ]
};

// ============================================
// 6. NEXT BOX TEASER
// ============================================

const TEASER_SEQUENCE = {
    name: 'teaser_sequence',
    trigger: 'days_before_ship_7',
    emails: [
        {
            id: 'teaser_1',
            delay: '0min',
            subject: 'Sneak peek: Your next box theme 👀',
            preheader: 'Something exciting is coming...',
            body: `
# {firstName}, your next box is almost ready.

We've spent the last few weeks testing, rejecting, and perfecting.

## 🎁 Theme Hint

*{themeHint}*

(That's all we're saying for now.)

## What We Can Tell You

- **Ships:** {shipDate}
- **Your tier:** {tierName}
- **Expected value:** Over ₹{expectedValue}

## In The Meantime

Got friends who'd love this? Share your referral code and get ₹200 each:

**{referralCode}**

[Share with Friends →](https://wa.me/?text=Check%20out%20ZapNest%20and%20use%20my%20code%20{referralCode}%20for%20₹200%20off!)

---

The countdown is on.

— Team ZapNest
      `
        }
    ]
};

// ============================================
// Export All Flows
// ============================================

const ALL_EMAIL_FLOWS = {
    welcome: WELCOME_SEQUENCE,
    payment: PAYMENT_SUCCESS,
    nurture: NURTURE_SEQUENCE,
    shipping: SHIPPING_SEQUENCE,
    retention: RETENTION_SEQUENCE,
    teaser: TEASER_SEQUENCE
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EMAIL_FLOWS, ALL_EMAIL_FLOWS };
}

if (typeof window !== 'undefined') {
    window.ZapNestEmailFlows = { config: EMAIL_FLOWS, flows: ALL_EMAIL_FLOWS };
}
