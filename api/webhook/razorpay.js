/**
 * ZapNest - Razorpay Webhook Handler
 * POST /api/webhook/razorpay
 * 
 * Handles Razorpay webhook events for payment lifecycle
 */

import crypto from 'crypto';

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];

    if (!signature || !RAZORPAY_WEBHOOK_SECRET) {
        console.error('[Webhook] Missing signature or secret');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Get raw body for signature verification
        const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
            .update(rawBody)
            .digest('hex');

        if (expectedSignature !== signature) {
            console.error('[Webhook] Signature verification failed');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const eventType = event.event;
        const payload = event.payload;

        console.log('[Webhook] Event received:', eventType);

        // Handle different event types
        switch (eventType) {
            case 'payment.captured':
                await handlePaymentCaptured(payload, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
                break;

            case 'payment.failed':
                await handlePaymentFailed(payload, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
                break;

            case 'order.paid':
                await handleOrderPaid(payload, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
                break;

            case 'refund.created':
                await handleRefundCreated(payload, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
                break;

            case 'refund.processed':
                await handleRefundProcessed(payload, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
                break;

            default:
                console.log('[Webhook] Unhandled event type:', eventType);
        }

        // Always respond 200 to acknowledge receipt
        return res.status(200).json({ received: true, event: eventType });

    } catch (error) {
        console.error('[Webhook] Error processing webhook:', error);
        // Still return 200 to prevent Razorpay from retrying
        return res.status(200).json({ received: true, error: 'Processing error' });
    }
}

async function handlePaymentCaptured(payload, supabaseUrl, supabaseKey) {
    const payment = payload.payment?.entity;
    if (!payment) return;

    const email = payment.notes?.email || payment.email;
    const orderId = payment.order_id;
    const paymentId = payment.id;
    const amount = payment.amount / 100; // Convert paise to rupees

    console.log('[Webhook] Payment captured:', paymentId, 'for', email);

    if (supabaseUrl && supabaseKey) {
        // Update payment record
        await fetch(
            `${supabaseUrl}/rest/v1/payments?razorpay_payment_id=eq.${paymentId}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    status: 'captured',
                    captured_at: new Date().toISOString()
                })
            }
        );

        // If payment doesn't exist, create it (idempotency)
        await fetch(
            `${supabaseUrl}/rest/v1/payments`,
            {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal,resolution=ignore-duplicates'
                },
                body: JSON.stringify({
                    email: email,
                    razorpay_order_id: orderId,
                    razorpay_payment_id: paymentId,
                    amount_inr: amount,
                    currency: payment.currency || 'INR',
                    status: 'captured',
                    tier: payment.notes?.tier || 'core',
                    captured_at: new Date().toISOString()
                })
            }
        );
    }
}

async function handlePaymentFailed(payload, supabaseUrl, supabaseKey) {
    const payment = payload.payment?.entity;
    if (!payment) return;

    const email = payment.notes?.email || payment.email;
    const orderId = payment.order_id;
    const paymentId = payment.id;
    const errorCode = payment.error_code;
    const errorDescription = payment.error_description;

    console.log('[Webhook] Payment failed:', paymentId, '-', errorDescription);

    if (supabaseUrl && supabaseKey) {
        // Record failed payment
        await fetch(
            `${supabaseUrl}/rest/v1/payments`,
            {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    email: email,
                    razorpay_order_id: orderId,
                    razorpay_payment_id: paymentId,
                    amount_inr: payment.amount / 100,
                    currency: payment.currency || 'INR',
                    status: 'failed',
                    error_code: errorCode,
                    error_description: errorDescription,
                    tier: payment.notes?.tier || 'core'
                })
            }
        );
    }
}

async function handleOrderPaid(payload, supabaseUrl, supabaseKey) {
    const order = payload.order?.entity;
    if (!order) return;

    console.log('[Webhook] Order paid:', order.id);

    // Order paid is usually redundant with payment.captured
    // But can be used for additional verification
}

async function handleRefundCreated(payload, supabaseUrl, supabaseKey) {
    const refund = payload.refund?.entity;
    if (!refund) return;

    console.log('[Webhook] Refund created:', refund.id);

    if (supabaseUrl && supabaseKey) {
        // Update payment record with refund status
        await fetch(
            `${supabaseUrl}/rest/v1/payments?razorpay_payment_id=eq.${refund.payment_id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    status: 'refund_pending',
                    refund_id: refund.id,
                    refund_amount: refund.amount / 100
                })
            }
        );
    }
}

async function handleRefundProcessed(payload, supabaseUrl, supabaseKey) {
    const refund = payload.refund?.entity;
    if (!refund) return;

    console.log('[Webhook] Refund processed:', refund.id);

    if (supabaseUrl && supabaseKey) {
        // Update payment record
        await fetch(
            `${supabaseUrl}/rest/v1/payments?razorpay_payment_id=eq.${refund.payment_id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    status: 'refunded',
                    refunded_at: new Date().toISOString()
                })
            }
        );

        // Get email from payment to update subscriber status
        const paymentResponse = await fetch(
            `${supabaseUrl}/rest/v1/payments?razorpay_payment_id=eq.${refund.payment_id}&select=email`,
            {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            }
        );

        const payments = await paymentResponse.json();
        if (payments.length > 0) {
            const email = payments[0].email;

            // Cancel subscriber
            await fetch(
                `${supabaseUrl}/rest/v1/subscribers?email=eq.${encodeURIComponent(email)}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        status: 'cancelled',
                        cancelled_at: new Date().toISOString()
                    })
                }
            );
        }
    }
}
