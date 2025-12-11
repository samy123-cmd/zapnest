# ZapNest Production Deployment Guide

## 📋 Pre-Deployment Checklist

Before deploying, complete these:

- [ ] Create `.gitignore` to exclude sensitive files
- [ ] Push code to GitHub
- [ ] Connect Vercel to GitHub
- [ ] Add custom domain
- [ ] Run database schema in Supabase
- [ ] Add Razorpay policy URLs

---

## Step 1: Create .gitignore

Create a `.gitignore` file to exclude sensitive/unnecessary files:

```
# Environment
.env
.env.local
*.log

# Dependencies (if any)
node_modules/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Internal planning docs (optional - remove if you want to version them)
marketing/future_audio_kit.md
```

---

## Step 2: Push to GitHub

```bash
# Check status
git status

# Add all files
git add .

# Commit
git commit -m "ZapNest v1.0 - Ready for Founder 500 launch"

# Create GitHub repo first, then:
git remote add origin https://github.com/YOUR_USERNAME/zapnest-store.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel

### Option A: Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Framework Preset: **Other** (static site)
5. Root Directory: `.` (the project root)
6. Build Command: Leave empty
7. Output Directory: Leave empty
8. Click **Deploy**

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, then for production:
vercel --prod
```

---

## Step 4: Custom Domain Setup

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add: `zapneststore.in`
3. Add: `www.zapneststore.in`
4. Vercel will give you DNS records to add:

### DNS Records to Add (at your domain registrar):

| Type | Name | Value |
|------|------|-------|
| A | @ | `76.76.19.19` |
| CNAME | www | `cname.vercel-dns.com` |

5. Wait 5-10 mins for DNS propagation
6. Vercel will auto-issue SSL certificate

---

## Step 5: Supabase Database Schema

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project: `vqxviqsvmlevabqihwir`
3. Go to **SQL Editor**
4. Run the contents of `supabase/members_schema.sql`
5. Verify tables are created: subscribers, orders, payments, member_sessions

---

## Step 6: Razorpay Policy Pages

After deployment, add these URLs in Razorpay Dashboard:

| Policy | URL |
|--------|-----|
| Cancellation & Refunds | `https://zapneststore.in/legal/refunds.html` |
| Terms & Conditions | `https://zapneststore.in/legal/terms.html` |
| Shipping | `https://zapneststore.in/legal/shipping.html` |
| Privacy | `https://zapneststore.in/legal/privacy.html` |
| Contact Us | `https://zapneststore.in/legal/contact.html` |

---

## Step 7: Environment Variables (If Using Build Step)

If you add a build step later, set these in Vercel:

| Variable | Value |
|----------|-------|
| SUPABASE_URL | `https://vqxviqsvmlevabqihwir.supabase.co` |
| SUPABASE_ANON_KEY | `(your anon key)` |
| RAZORPAY_KEY | `rzp_live_xxxxx` |

---

## 🎉 Post-Deployment Verification

Test these URLs:

1. ✅ `https://zapneststore.in/landing/` — Landing page
2. ✅ `https://zapneststore.in/member/` — Member dashboard
3. ✅ `https://zapneststore.in/payment/` — Payment page
4. ✅ `https://zapneststore.in/admin/` — Admin dashboard
5. ✅ `https://zapneststore.in/legal/terms.html` — Terms
6. ✅ `https://zapneststore.in/legal/privacy.html` — Privacy
7. ✅ `https://zapneststore.in/legal/refunds.html` — Refunds
8. ✅ `https://zapneststore.in/legal/shipping.html` — Shipping
9. ✅ `https://zapneststore.in/legal/contact.html` — Contact

---

## 🔐 Security Reminder

Before going fully live:

1. [ ] Replace test Razorpay key with live key
2. [ ] Set up Resend API key for emails
3. [ ] Create admin user in Supabase Auth
4. [ ] Enable RLS on waitlist table
