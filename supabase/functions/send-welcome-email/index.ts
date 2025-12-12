import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { email, tier, position } = await req.json()

        if (!email) {
            return new Response(
                JSON.stringify({ error: 'Email is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Generate welcome email HTML
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ZapNest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0A; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          <!-- Logo -->
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <span style="font-size: 24px; font-weight: 800; color: #00FF88;">ZapNest</span>
            </td>
          </tr>
          
          <!-- Hero -->
          <tr>
            <td style="background: linear-gradient(135deg, #141414 0%, #0d1a0f 100%); border-radius: 16px; padding: 48px 40px; text-align: center; border: 1px solid #2A2A2A;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="color: #FFFFFF; font-size: 28px; font-weight: 800; margin: 0 0 16px 0; letter-spacing: -0.02em;">
                You're In, Founder!
              </h1>
              <p style="color: #A0A0A0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Welcome to the ZapNest Black Box founding batch. You're now one of just 500 people who'll receive our first drop.
              </p>
              <div style="background: rgba(0, 255, 136, 0.15); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #00FF88; font-size: 14px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.1em;">Your Selected Tier</p>
                <p style="color: #FFFFFF; font-size: 24px; font-weight: 800; margin: 0; text-transform: capitalize;">${tier || 'Core'}</p>
              </div>
            </td>
          </tr>
          
          <!-- What's Next -->
          <tr>
            <td style="padding: 40px 0;">
              <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin: 0 0 24px 0;">What happens next?</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #2A2A2A;">
                    <span style="color: #00FF88; font-weight: 700; margin-right: 12px;">1.</span>
                    <span style="color: #B8B8B8;">We'll send you payment instructions soon</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #2A2A2A;">
                    <span style="color: #00FF88; font-weight: 700; margin-right: 12px;">2.</span>
                    <span style="color: #B8B8B8;">Receive exclusive updates about your first box</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="color: #00FF88; font-weight: 700; margin-right: 12px;">3.</span>
                    <span style="color: #B8B8B8;">Your first ZapNest Black Box ships February 2026</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="text-align: center; padding: 24px 0; border-top: 1px solid #2A2A2A;">
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
    `

        // Send email via Resend
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'ZapNest <hello@zapneststore.in>',
                to: [email],
                subject: "🎉 You're in! Welcome to ZapNest Black Box",
                html: html,
            }),
        })

        const data = await res.json()

        if (res.ok) {
            return new Response(
                JSON.stringify({ success: true, id: data.id }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        } else {
            console.error('Resend error:', data)
            return new Response(
                JSON.stringify({ success: false, error: data.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
