# ZapNest Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API

## 2. Run Database Schema

In the Supabase SQL Editor, run the contents of `schema.sql`:

```sql
-- Copy and paste the entire contents of supabase/schema.sql
```

This creates:
- `waitlist` table with RLS policies
- `referral_codes` table with auto-generation
- `analytics_events` table for privacy-first analytics
- Helper functions and views

## 3. Configure Environment Variables

### Landing Page (Browser)

Add to your `index.html` before other scripts:

```html
<script>
  window.SUPABASE_URL = 'https://your-project.supabase.co';
  window.SUPABASE_ANON_KEY = 'your-anon-key';
  window.ANALYTICS_CONSENT = false; // Set true after user consents
</script>
<script type="module" src="/supabase/supabase-client.js"></script>
```

### Admin Dashboard (Server-side)

For admin operations, use the **Service Role Key** (never expose in browser):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

## 4. Update Landing Page Form

Replace the mock API call in `landing/main.js`:

```javascript
// Import the API
import { waitlistAPI } from '../supabase/supabase-client.js';

// In handleSubmit function, replace submitToAPI call with:
const response = await waitlistAPI.signup({
  email: email,
  tier: tier,
  referral_code: referral,
  consent: consent,
  source: document.referrer || 'direct'
});

if (response.success) {
  // Track success
  trackEvent('form_success', { tier, email_hash });
  showSuccess();
} else {
  throw new Error(response.error);
}
```

## 5. Admin Dashboard Connection

Update `admin/admin.js` CONFIG:

```javascript
const CONFIG = {
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-service-role-key', // Only in admin!
  refreshInterval: 30000
};
```

## 6. RLS Policies Summary

| Table | anon (Public) | service_role (Admin) |
|-------|---------------|----------------------|
| waitlist | INSERT only (with consent) | Full access |
| referral_codes | SELECT only | Full access |
| analytics_events | INSERT only | Full access |

## 7. Testing

1. Open landing page at http://localhost:8080
2. Fill out the waitlist form
3. Check Supabase Table Editor → waitlist
4. Verify the entry was created

## Security Notes

- ✅ Email is hashed (SHA-256) before analytics
- ✅ RLS prevents unauthorized reads
- ✅ Consent required before signup
- ✅ Referral codes auto-generated
- ⚠️ Never expose service role key in browser
- ⚠️ Use environment variables for production
