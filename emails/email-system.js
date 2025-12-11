/**
 * ZapNest Email System
 * Email templates and Resend integration
 * 
 * Usage:
 * 1. Set RESEND_API_KEY environment variable
 * 2. Import functions: sendWelcomeEmail, sendNurtureEmail, etc.
 * 
 * For server-side use (Edge Functions, Node.js)
 */

// ============================================
// Configuration
// ============================================

const EMAIL_CONFIG = {
  from: 'ZapNest <hello@zapnest.in>',
  replyTo: 'support@zapnest.in',

  // Resend API (set via environment)
  apiKey: null, // Set via init()

  // Brand
  brandColor: '#00FF88',
  logoUrl: 'https://zapnest.in/logo.png',
  websiteUrl: 'https://zapnest.in'
};

// ============================================
// Email Templates
// ============================================

const TEMPLATES = {
  // Welcome email after waitlist signup
  welcome: {
    subject: "🎉 You're in! Welcome to ZapNest Black Box",
    generate: (data) => `
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
                You're In, ${data.name || 'Founder'}!
              </h1>
              <p style="color: #A0A0A0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Welcome to the ZapNest Black Box founding batch. You're now one of just 500 people who'll receive our first drop.
              </p>
              <div style="background: rgba(0, 255, 136, 0.15); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #00FF88; font-size: 14px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.1em;">Your Waitlist Position</p>
                <p style="color: #FFFFFF; font-size: 36px; font-weight: 800; margin: 0;">#${data.position || '—'}</p>
              </div>
              <a href="${EMAIL_CONFIG.websiteUrl}/payment/?email=${encodeURIComponent(data.email)}" style="display: inline-block; background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); color: #0A0A0A; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0, 255, 136, 0.25);">
                Complete Your Subscription →
              </a>
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
                    <span style="color: #B8B8B8;">Complete payment to lock in your founder pricing</span>
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
                    <span style="color: #B8B8B8;">Your first ZapNest Black Box ships February 2025</span>
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
                <a href="${EMAIL_CONFIG.websiteUrl}" style="color: #00FF88; text-decoration: none;">zapnest.in</a>
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
  },

  // Payment confirmation
  paymentSuccess: {
    subject: "✅ Payment Confirmed — Welcome, Founder!",
    generate: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            <td style="background: #141414; border-radius: 16px; padding: 48px 40px; text-align: center; border: 1px solid #00FF88;">
              <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
              <h1 style="color: #FFFFFF; font-size: 28px; font-weight: 800; margin: 0 0 16px 0;">
                You're a Founding Member!
              </h1>
              <p style="color: #A0A0A0; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Your payment was successful. Welcome to the ZapNest family.
              </p>
              
              <table width="100%" style="background: #0A0A0A; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 16px; text-align: left;">
                    <span style="color: #666666; font-size: 12px;">Plan</span><br>
                    <span style="color: #FFFFFF; font-size: 16px; font-weight: 600;">${data.tier}</span>
                  </td>
                  <td style="padding: 8px 16px; text-align: right;">
                    <span style="color: #666666; font-size: 12px;">Amount</span><br>
                    <span style="color: #00FF88; font-size: 16px; font-weight: 600;">₹${data.amount}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 16px; text-align: left;">
                    <span style="color: #666666; font-size: 12px;">Payment ID</span><br>
                    <span style="color: #FFFFFF; font-size: 14px; font-family: monospace;">${data.paymentId}</span>
                  </td>
                  <td style="padding: 8px 16px; text-align: right;">
                    <span style="color: #666666; font-size: 12px;">First Box</span><br>
                    <span style="color: #FFFFFF; font-size: 16px; font-weight: 600;">Feb 2025</span>
                  </td>
                </tr>
              </table>
              
              <a href="${EMAIL_CONFIG.websiteUrl}/member/" style="display: inline-block; background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); color: #0A0A0A; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 8px;">
                Go to Dashboard →
              </a>
            </td>
          </tr>
          
          <tr>
            <td style="text-align: center; padding: 24px 0;">
              <p style="color: #666666; font-size: 12px; margin: 0;">
                Questions? Reply to this email or contact support@zapnest.in
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
  },

  // Shipping notification
  shipped: {
    subject: "📦 Your ZapNest Black Box is on the way!",
    generate: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
              <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
              <h1 style="color: #FFFFFF; font-size: 28px; font-weight: 800; margin: 0 0 16px 0;">
                Your Box is Shipped!
              </h1>
              <p style="color: #A0A0A0; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Your ${data.month} ZapNest Black Box is on its way.
              </p>
              
              <table width="100%" style="background: #0A0A0A; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <span style="color: #666666; font-size: 12px;">Tracking Number</span><br>
                    <span style="color: #00FF88; font-size: 18px; font-weight: 700; font-family: monospace;">${data.trackingNumber}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px;">
                    <span style="color: #666666; font-size: 12px;">Courier</span><br>
                    <span style="color: #FFFFFF; font-size: 16px;">${data.courier}</span>
                  </td>
                </tr>
              </table>
              
              <a href="${data.trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); color: #0A0A0A; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 8px;">
                Track Your Package →
              </a>
            </td>
          </tr>
          
          <tr>
            <td style="text-align: center; padding: 24px 0;">
              <p style="color: #666666; font-size: 12px; margin: 0;">
                Expected delivery: 3-5 business days
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
  }
};

// ============================================
// Nurture Email Sequence
// ============================================

const NURTURE_SEQUENCE = [
  {
    id: 'nurture_1',
    delay: 1, // days after signup
    subject: "The story behind ZapNest Black Box",
    generate: (data) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0A; padding: 40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
        <tr><td style="padding: 20px 0; text-align: center;">
          <span style="font-size: 24px; font-weight: 800; color: #00FF88;">ZapNest</span>
        </td></tr>
        <tr><td style="padding: 0 0 40px 0;">
          <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0 0 24px 0;">
            Hi ${data.name || 'there'},
          </h1>
          <p style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
            You joined the ZapNest waitlist yesterday, and I wanted to share why we're building this.
          </p>
          <p style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
            Everything good starts with being frustrated with what exists. We were tired of:
          </p>
          <ul style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 24px;">
            <li>Overhyped products that die in 2 months</li>
            <li>Endless research just to find something decent</li>
            <li>The "Amazon scroll" paralysis of too much choice</li>
          </ul>
          <p style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
            So we built a system. AI scouts thousands of products. Humans test what survives. Only the real winners make it to your doorstep.
          </p>
          <p style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
            <strong style="color: #FFFFFF;">Tomorrow, I'll show you exactly how we test products.</strong> 50+ fail our standards every month. You'll see why.
          </p>
          <p style="color: #666666; font-size: 14px; margin: 40px 0 0 0;">
            — Team ZapNest
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `
  },
  {
    id: 'nurture_2',
    delay: 3,
    subject: "Why 50+ products fail our tests monthly",
    generate: (data) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0A; padding: 40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
        <tr><td style="padding: 20px 0; text-align: center;">
          <span style="font-size: 24px; font-weight: 800; color: #00FF88;">ZapNest</span>
        </td></tr>
        <tr><td style="padding: 0 0 40px 0;">
          <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0 0 24px 0;">
            Our rejection rate might surprise you
          </h1>
          <p style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
            Last month, our AI flagged 127 potentially interesting products. After human testing, <strong style="color: #FF4D4D;">only 4 made the cut</strong>.
          </p>
          <p style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
            Here's what kills most products:
          </p>
          <table width="100%" style="margin: 24px 0;">
            <tr>
              <td style="background: #141414; border: 1px solid #2A2A2A; border-radius: 8px; padding: 16px; margin-bottom: 8px;">
                <span style="color: #FF4D4D; font-weight: 700;">🔋 Battery Life Claims</span>
                <p style="color: #666666; font-size: 14px; margin: 8px 0 0 0;">Marketing says "20 hours". Real-world testing: 4.5 hours. Rejected.</p>
              </td>
            </tr>
            <tr><td style="height: 12px;"></td></tr>
            <tr>
              <td style="background: #141414; border: 1px solid #2A2A2A; border-radius: 8px; padding: 16px;">
                <span style="color: #FF4D4D; font-weight: 700;">🔧 Build Quality</span>
                <p style="color: #666666; font-size: 14px; margin: 8px 0 0 0;">Feels premium for 2 weeks. Creaky plastic by week 3. Rejected.</p>
              </td>
            </tr>
            <tr><td style="height: 12px;"></td></tr>
            <tr>
              <td style="background: #141414; border: 1px solid #2A2A2A; border-radius: 8px; padding: 16px;">
                <span style="color: #FF4D4D; font-weight: 700;">📋 Missing Certifications</span>
                <p style="color: #666666; font-size: 14px; margin: 8px 0 0 0;">No BIS mark. No proper battery certification. Hard no.</p>
              </td>
            </tr>
          </table>
          <p style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
            Every product in your Black Box has survived this gauntlet. That's the difference.
          </p>
          <p style="color: #666666; font-size: 14px; margin: 40px 0 0 0;">
            — Team ZapNest
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `
  },
  {
    id: 'nurture_3',
    delay: 5,
    subject: "🔮 A hint about your first box",
    generate: (data) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0A; padding: 40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
        <tr><td style="padding: 20px 0; text-align: center;">
          <span style="font-size: 24px; font-weight: 800; color: #00FF88;">ZapNest</span>
        </td></tr>
        <tr><td style="padding: 0 0 40px 0; text-align: center;">
          <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0 0 24px 0;">
            February's hero product...
          </h1>
          <div style="background: linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, #141414 100%); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 16px; padding: 40px; margin: 24px 0;">
            <p style="color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0;">We can't tell you everything, but...</p>
            <p style="color: #00FF88; font-size: 18px; font-weight: 600; margin: 0;">
              📺 Not a phone accessory<br>
              ✨ Under ₹8,000 retail value<br>
              🔋 3.2 hours real-world battery (we tested)<br>
              🔊 Best-in-class audio clarity
            </p>
          </div>
          <p style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 24px 0;">
            The full reveal happens December 31st for founding members.
          </p>
          <a href="${EMAIL_CONFIG.websiteUrl}/payment/?email=${encodeURIComponent(data.email)}" style="display: inline-block; background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); color: #0A0A0A; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 8px;">
            Lock In Your Spot →
          </a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `
  },
  {
    id: 'nurture_4',
    delay: 7,
    subject: "Only ${slotsRemaining} founder slots left",
    generate: (data) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0A; padding: 40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
        <tr><td style="padding: 20px 0; text-align: center;">
          <span style="font-size: 24px; font-weight: 800; color: #00FF88;">ZapNest</span>
        </td></tr>
        <tr><td style="padding: 0 0 40px 0; text-align: center;">
          <h1 style="color: #FFFFFF; font-size: 28px; font-weight: 700; margin: 0 0 24px 0;">
            ⏰ Time check
          </h1>
          <div style="background: #141414; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0;">Founder slots remaining</p>
            <p style="color: #FF4D4D; font-size: 48px; font-weight: 800; margin: 0;">${data.slotsRemaining || '62'}</p>
            <p style="color: #666666; font-size: 14px; margin: 8px 0 0 0;">of 500</p>
          </div>
          <p style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
            Once these are gone, new members pay full price.<br>
            <strong style="color: #FFFFFF;">Founders lock in their rate forever.</strong>
          </p>
          <a href="${EMAIL_CONFIG.websiteUrl}/payment/?email=${encodeURIComponent(data.email)}" style="display: inline-block; background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); color: #0A0A0A; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 8px; margin-top: 16px;">
            Claim Your Spot →
          </a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `
  },
  {
    id: 'nurture_5',
    delay: 10,
    subject: "Last call before we close the waitlist",
    generate: (data) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0A; padding: 40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
        <tr><td style="padding: 20px 0; text-align: center;">
          <span style="font-size: 24px; font-weight: 800; color: #00FF88;">ZapNest</span>
        </td></tr>
        <tr><td style="padding: 0 0 40px 0;">
          <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0 0 24px 0;">
            ${data.name || 'Hey'},
          </h1>
          <p style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
            This is my last email before the founders batch closes.
          </p>
          <p style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
            You signed up because you were curious. Now you've seen:
          </p>
          <ul style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 24px;">
            <li>How ruthlessly we test products (96% rejection rate)</li>
            <li>The kind of tech that makes the cut</li>
            <li>Hints about January's hero product</li>
          </ul>
          <p style="color: #B8B8B8; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
            <strong style="color: #FFFFFF;">If this resonates, now's the time.</strong> After December 31st, the founder pricing goes away.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${EMAIL_CONFIG.websiteUrl}/payment/?email=${encodeURIComponent(data.email)}" style="display: inline-block; background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); color: #0A0A0A; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 8px;">
              Join as Founder →
            </a>
          </div>
          <p style="color: #666666; font-size: 14px; margin: 0;">
            If not, no hard feelings. I hope you find what you're looking for.
          </p>
          <p style="color: #666666; font-size: 14px; margin: 24px 0 0 0;">
            — Team ZapNest
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `
  }
];

// ============================================
// Send Functions (Resend API)
// ============================================

/**
 * Initialize email system with API key
 */
function initEmail(apiKey) {
  EMAIL_CONFIG.apiKey = apiKey;
}

/**
 * Send email via Resend API
 */
async function sendEmail(to, subject, html) {
  if (!EMAIL_CONFIG.apiKey) {
    console.error('[Email] API key not set. Call initEmail() first.');
    return { success: false, error: 'API key not set' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_CONFIG.from,
        to: [to],
        subject: subject,
        html: html,
        reply_to: EMAIL_CONFIG.replyTo
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('[Email] Sent successfully:', result.id);
      return { success: true, id: result.id };
    } else {
      console.error('[Email] Send failed:', result);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error('[Email] Network error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email
 */
async function sendWelcomeEmail(email, data = {}) {
  const template = TEMPLATES.welcome;
  const html = template.generate({ email, ...data });
  return sendEmail(email, template.subject, html);
}

/**
 * Send payment confirmation
 */
async function sendPaymentConfirmation(email, data) {
  const template = TEMPLATES.paymentSuccess;
  const html = template.generate(data);
  return sendEmail(email, template.subject, html);
}

/**
 * Send shipping notification
 */
async function sendShippingNotification(email, data) {
  const template = TEMPLATES.shipped;
  const html = template.generate(data);
  return sendEmail(email, template.subject, html);
}

/**
 * Send nurture email by sequence number (1-5)
 */
async function sendNurtureEmail(email, sequenceNumber, data = {}) {
  const nurture = NURTURE_SEQUENCE[sequenceNumber - 1];
  if (!nurture) {
    return { success: false, error: 'Invalid sequence number' };
  }

  const subject = nurture.subject.replace('${slotsRemaining}', data.slotsRemaining || '62');
  const html = nurture.generate({ email, ...data });
  return sendEmail(email, subject, html);
}

// ============================================
// Export for use
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initEmail,
    sendEmail,
    sendWelcomeEmail,
    sendPaymentConfirmation,
    sendShippingNotification,
    sendNurtureEmail,
    TEMPLATES,
    NURTURE_SEQUENCE,
    EMAIL_CONFIG
  };
}

// Browser/global export
if (typeof window !== 'undefined') {
  window.ZapNestEmail = {
    initEmail,
    sendEmail,
    sendWelcomeEmail,
    sendPaymentConfirmation,
    sendShippingNotification,
    sendNurtureEmail
  };
}
