// Vercel Serverless Function - Send Magic Link Email via Resend

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

    const { email, magicLink } = req.body;

    if (!email || !magicLink) {
        return res.status(400).json({ error: 'Email and magicLink are required' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        return res.status(500).json({ error: 'Email service not configured' });
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In to ZapNest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0A; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <span style="font-size: 24px; font-weight: 800; color: #00FF88;">ZapNest</span>
            </td>
          </tr>
          
          <tr>
            <td style="background: #141414; border-radius: 16px; padding: 48px 40px; text-align: center; border: 1px solid #2A2A2A;">
              <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
              <h1 style="color: #FFFFFF; font-size: 28px; font-weight: 800; margin: 0 0 16px 0;">
                Sign In to ZapNest
              </h1>
              <p style="color: #A0A0A0; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Click the button below to sign in to your ZapNest member dashboard. This link expires in 15 minutes.
              </p>
              
              <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); color: #0A0A0A; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0, 255, 136, 0.25);">
                Sign In to Dashboard →
              </a>
              
              <p style="color: #666666; font-size: 14px; margin: 32px 0 0 0;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="text-align: center; padding: 24px 0;">
              <p style="color: #666666; font-size: 12px; margin: 0;">
                ZapNest Technologies Pvt. Ltd.<br>
                <a href="https://zapneststore.in" style="color: #00FF88; text-decoration: none;">zapneststore.in</a>
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
                subject: "🔐 Sign in to your ZapNest dashboard",
                html: html,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Magic link email sent:', data.id);
            return res.status(200).json({ success: true, id: data.id });
        } else {
            console.error('Resend error:', data);
            return res.status(400).json({ success: false, error: data.message });
        }
    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
