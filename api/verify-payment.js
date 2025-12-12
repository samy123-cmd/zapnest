/**
 * ZapNest - Verify Payment
 * POST /api/verify-payment
 * 
 * Verifies Razorpay payment signature and activates subscription
 */

import crypto from 'crypto';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        email,
        tier
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment verification data' });
    }

    if (!email || !tier) {
        return res.status(400).json({ error: 'Missing email or tier' });
    }

    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!RAZORPAY_KEY_SECRET) {
        console.error('[Verify] Razorpay secret not configured');
        return res.status(500).json({ error: 'Payment verification not configured' });
    }

    try {
        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.error('[Verify] Signature mismatch');
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        console.log('[Verify] Payment verified:', razorpay_payment_id);

        // Tier pricing for storing in DB
        const tierPricing = {
            lite: 1599,
            core: 2999,
            elite: 4999
        };

        const monthlyPrice = tierPricing[tier.toLowerCase()] || 2999;
        const normalizedEmail = email.toLowerCase().trim();

        // Calculate next billing date (30 days from now)
        const nextBillingDate = new Date();
        nextBillingDate.setDate(nextBillingDate.getDate() + 30);

        // Generate referral code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let referralCode = 'ZN-';
        for (let i = 0; i < 4; i++) {
            referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check if subscriber already exists (idempotency)
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
            const checkResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(normalizedEmail)}`,
                {
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    }
                }
            );

            const existingSubscribers = await checkResponse.json();

            if (existingSubscribers.length > 0) {
                // Update existing subscriber
                const updateResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(normalizedEmail)}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'apikey': SUPABASE_SERVICE_ROLE_KEY,
                            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({
                            tier: tier.toLowerCase(),
                            status: 'active',
                            monthly_price: monthlyPrice,
                            next_billing_date: nextBillingDate.toISOString(),
                            razorpay_subscription_id: razorpay_payment_id
                        })
                    }
                );

                if (!updateResponse.ok) {
                    console.error('[Verify] Failed to update subscriber');
                }
            } else {
                // Create new subscriber
                const createResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/subscribers`,
                    {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_SERVICE_ROLE_KEY,
                            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({
                            email: normalizedEmail,
                            tier: tier.toLowerCase(),
                            status: 'active',
                            monthly_price: monthlyPrice,
                            is_founder: true,
                            next_billing_date: nextBillingDate.toISOString(),
                            referral_code: referralCode,
                            razorpay_subscription_id: razorpay_payment_id
                        })
                    }
                );

                if (!createResponse.ok) {
                    const error = await createResponse.text();
                    console.error('[Verify] Failed to create subscriber:', error);
                }
            }

            // Record payment in payments table
            await fetch(
                `${SUPABASE_URL}/rest/v1/payments`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        email: normalizedEmail,
                        razorpay_order_id: razorpay_order_id,
                        razorpay_payment_id: razorpay_payment_id,
                        amount_inr: monthlyPrice,
                        currency: 'INR',
                        status: 'captured',
                        tier: tier.toLowerCase()
                    })
                }
            );

            // Update waitlist status
            await fetch(
                `${SUPABASE_URL}/rest/v1/waitlist?email=eq.${encodeURIComponent(normalizedEmail)}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        converted_to_subscriber: true,
                        converted_at: new Date().toISOString()
                    })
                }
            );
        }

        // Send confirmation email
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        if (RESEND_API_KEY) {
            try {
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'ZapNest <hello@zapneststore.in>',
                        to: normalizedEmail,
                        subject: '🎉 Welcome to ZapNest! Your subscription is active',
                        html: `
                            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 40px;">
                                <h1 style="color: #00FF88; margin-bottom: 20px;">Welcome to ZapNest! 🎉</h1>
                                <p style="color: #b8b8b8; font-size: 16px; line-height: 1.6;">
                                    Your <strong style="color: #00FF88;">${tier.charAt(0).toUpperCase() + tier.slice(1)}</strong> subscription is now active!
                                </p>
                                <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #00FF88;">
                                    <p style="margin: 0; color: #b8b8b8;"><strong>Order ID:</strong> ${razorpay_order_id}</p>
                                    <p style="margin: 8px 0; color: #b8b8b8;"><strong>Amount:</strong> ₹${monthlyPrice.toLocaleString('en-IN')}</p>
                                    <p style="margin: 8px 0 0; color: #b8b8b8;"><strong>Next Billing:</strong> ${nextBillingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <h2 style="color: #ffffff; margin-top: 32px;">What's Next?</h2>
                                <ul style="color: #b8b8b8; line-height: 2;">
                                    <li>Your first box ships in <strong>February 2026</strong></li>
                                    <li>You'll get the exclusive <strong>Founders Tee</strong></li>
                                    <li>Your <strong>Genesis Token #001-500</strong> is reserved</li>
                                </ul>
                                <p style="margin-top: 32px;">
                                    <a href="https://zapneststore.in/member/" style="display: inline-block; background: linear-gradient(135deg, #00FF88, #00CC6A); color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                        View Your Dashboard →
                                    </a>
                                </p>
                                <p style="color: #666; font-size: 14px; margin-top: 40px;">
                                    Thank you for being a founding member!<br>
                                    — The ZapNest Team
                                </p>
                            </div>
                        `
                    })
                });
                console.log('[Verify] Confirmation email sent');
            } catch (emailError) {
                console.error('[Verify] Email send failed:', emailError);
                // Don't fail the request if email fails
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Payment verified and subscription activated',
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            tier: tier.toLowerCase(),
            next_billing_date: nextBillingDate.toISOString()
        });

    } catch (error) {
        console.error('[Verify] Error:', error);
        return res.status(500).json({ error: 'Payment verification failed' });
    }
}
