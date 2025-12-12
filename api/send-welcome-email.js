// Vercel Serverless Function - Send Welcome Email via Resend
// Premium, polished email for ZapNest Founders

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

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  // Tier-specific pricing and content
  const tierDetails = {
    lite: { name: 'Lite', price: '₹1,599', color: '#00FF88', items: '1 curated accessory' },
    core: { name: 'Core', price: '₹2,999', color: '#00FF88', items: '1 hero product + accessories' },
    elite: { name: 'Elite', price: '₹4,999', color: '#FFD700', items: 'Premium hero + 2-3 accessories' }
  };

  const tierInfo = tierDetails[tier?.toLowerCase()] || tierDetails.core;

  // Premium email HTML
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to ZapNest</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0A;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 0 0 32px 0; text-align: center;">
              <span style="font-size: 28px; font-weight: 800; color: #00FF88; letter-spacing: -0.02em;">ZapNest</span>
              <span style="color: #666666; font-size: 14px; display: block; margin-top: 4px;">Black Box</span>
            </td>
          </tr>
          
          <!-- Hero Card -->
          <tr>
            <td style="background: linear-gradient(145deg, #141414 0%, #0D1A10 100%); border-radius: 20px; padding: 48px 40px; text-align: center; border: 1px solid rgba(0, 255, 136, 0.2);">
              
              <!-- Badge -->
              <div style="display: inline-block; background: rgba(0, 255, 136, 0.15); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 100px; padding: 8px 20px; margin-bottom: 24px;">
                <span style="color: #00FF88; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">✨ Founder #001-500</span>
              </div>
              
              <!-- Title -->
              <h1 style="color: #FFFFFF; font-size: 32px; font-weight: 800; margin: 0 0 12px 0; letter-spacing: -0.03em; line-height: 1.2;">
                You're In!
              </h1>
              <p style="color: #A0A0A0; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Welcome to the founding batch of ZapNest Black Box.
              </p>
              
              <!-- Tier Box -->
              <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid #2A2A2A; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                <p style="color: #888888; font-size: 12px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.15em;">Your Selected Tier</p>
                <p style="color: ${tierInfo.color}; font-size: 28px; font-weight: 800; margin: 0 0 4px 0;">${tierInfo.name}</p>
                <p style="color: #666666; font-size: 14px; margin: 0;">${tierInfo.price}/month</p>
              </div>
              
              <!-- CTA -->
              <a href="https://zapneststore.in/member/" style="display: inline-block; background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); color: #000000; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0, 255, 136, 0.3);">
                Access Your Dashboard →
              </a>
            </td>
          </tr>
          
          <!-- What's Next Section -->
          <tr>
            <td style="padding: 48px 0 0 0;">
              <h2 style="color: #FFFFFF; font-size: 18px; font-weight: 700; margin: 0 0 24px 0;">What happens next?</h2>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #1F1F1F;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="32" style="color: #00FF88; font-size: 18px; font-weight: 700; vertical-align: top;">1</td>
                        <td style="color: #B8B8B8; font-size: 15px; line-height: 1.5;">
                          <strong style="color: #FFFFFF;">Complete your subscription</strong><br>
                          Log into your dashboard to make your first payment.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #1F1F1F;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="32" style="color: #00FF88; font-size: 18px; font-weight: 700; vertical-align: top;">2</td>
                        <td style="color: #B8B8B8; font-size: 15px; line-height: 1.5;">
                          <strong style="color: #FFFFFF;">Get exclusive updates</strong><br>
                          We'll share sneak peeks and behind-the-scenes content.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="32" style="color: #00FF88; font-size: 18px; font-weight: 700; vertical-align: top;">3</td>
                        <td style="color: #B8B8B8; font-size: 15px; line-height: 1.5;">
                          <strong style="color: #FFFFFF;">First box ships February 2026</strong><br>
                          Your ${tierInfo.items} + exclusive Founders Tee.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Founder Perks -->
          <tr>
            <td style="padding: 40px 0;">
              <div style="background: rgba(255, 215, 0, 0.08); border: 1px solid rgba(255, 215, 0, 0.2); border-radius: 16px; padding: 24px;">
                <p style="color: #FFD700; font-size: 14px; font-weight: 700; margin: 0 0 12px 0;">🎁 Your Founder Rewards</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="color: #B8B8B8; font-size: 14px; line-height: 1.8;">
                  <tr><td>✓ Exclusive Founders Tee (ships with first box)</td></tr>
                  <tr><td>✓ Genesis Token #001–500</td></tr>
                  <tr><td>✓ Lifetime founder pricing locked forever</td></tr>
                  <tr><td>✓ Priority support & early access</td></tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="text-align: center; padding: 24px 0; border-top: 1px solid #1F1F1F;">
              <p style="color: #555555; font-size: 13px; margin: 0 0 8px 0;">
                Questions? Reply to this email or reach us at<br>
                <a href="mailto:hello@zapneststore.in" style="color: #00FF88; text-decoration: none;">hello@zapneststore.in</a>
              </p>
              <p style="color: #444444; font-size: 12px; margin: 16px 0 0 0;">
                ZapNest Technologies Pvt. Ltd.<br>
                <a href="https://zapneststore.in" style="color: #666666; text-decoration: none;">zapneststore.in</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ZapNest <hello@zapneststore.in>',
        to: [email],
        subject: "🎉 You're a Founder! Welcome to ZapNest Black Box",
        html: html,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('[Email] Welcome email sent:', data.id);
      return res.status(200).json({ success: true, id: data.id });
    } else {
      console.error('[Email] Resend error:', data);
      return res.status(400).json({ success: false, error: data.message });
    }
  } catch (error) {
    console.error('[Email] Error sending:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
