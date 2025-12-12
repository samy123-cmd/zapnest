/**
 * ZapNest - Create Payment Order
 * POST /api/create-payment
 * 
 * Creates a Razorpay order for subscription payment
 */

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

    const { email, tier } = req.body;

    if (!email || !tier) {
        return res.status(400).json({ error: 'Email and tier are required' });
    }

    // Validate tier and get pricing
    const tierPricing = {
        lite: { amount: 159900, name: 'Lite' },      // ₹1,599 in paise
        core: { amount: 299900, name: 'Core' },      // ₹2,999 in paise
        elite: { amount: 499900, name: 'Elite' }     // ₹4,999 in paise
    };

    const selectedTier = tierPricing[tier.toLowerCase()];
    if (!selectedTier) {
        return res.status(400).json({ error: 'Invalid tier. Must be core, pro, or elite' });
    }

    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        console.error('[Payment] Razorpay credentials not configured');
        return res.status(500).json({ error: 'Payment system not configured' });
    }

    try {
        // Create Razorpay order
        const orderData = {
            amount: selectedTier.amount,
            currency: 'INR',
            receipt: `zn_${Date.now()}_${email.split('@')[0].slice(0, 10)}`,
            notes: {
                email: email.toLowerCase().trim(),
                tier: tier.toLowerCase(),
                tier_name: selectedTier.name,
                source: 'member_dashboard'
            }
        };

        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('[Payment] Razorpay order creation failed:', error);
            return res.status(500).json({ error: 'Failed to create payment order' });
        }

        const order = await response.json();
        console.log('[Payment] Order created:', order.id);

        return res.status(200).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: RAZORPAY_KEY_ID,
            prefill: {
                email: email.toLowerCase().trim()
            },
            notes: order.notes,
            theme: {
                color: '#00FF88'
            }
        });

    } catch (error) {
        console.error('[Payment] Error creating order:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
