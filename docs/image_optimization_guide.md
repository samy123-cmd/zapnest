# Image Optimization Guide

## Current Assets

| File | Current Size | Target Size |
|------|--------------|-------------|
| `hero-black-box.png` | 849 KB | <200 KB |
| `og-zapnest-founders.jpg` | 488 KB | <150 KB |

---

## Step 1: Convert to WebP

### Using Squoosh (Web-based, Free)

1. Go to [squoosh.app](https://squoosh.app)
2. Upload `hero-black-box.png`
3. Select **WebP** format on the right panel
4. Adjust quality slider to ~80-85%
5. Target: <200KB
6. Download as `hero-black-box.webp`
7. Repeat for `og-zapnest-founders.jpg`

### Using Command Line (if you have cwebp installed)

```bash
# Convert hero image
cwebp -q 85 hero-black-box.png -o hero-black-box.webp

# Convert OG image
cwebp -q 80 og-zapnest-founders.jpg -o og-zapnest-founders.webp
```

---

## Step 2: Update HTML to Use WebP with Fallback

The landing page already uses `<picture>` element. Update like this:

```html
<picture>
  <source srcset="assets/hero-black-box.webp" type="image/webp">
  <source srcset="assets/hero-black-box.png" type="image/png">
  <img src="assets/hero-black-box.png" 
       alt="ZapNest Black Box" 
       width="600" height="400"
       loading="eager" fetchpriority="high">
</picture>
```

---

## Step 3: Verify LCP Improvement

After adding WebP:

1. Open Chrome DevTools → Lighthouse
2. Run Performance audit
3. Check LCP metric (target: <2.5s)

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Hero image size | 849 KB | ~150-200 KB |
| OG image size | 488 KB | ~100-150 KB |
| Total savings | — | ~600+ KB |
| LCP impact | — | ~0.5-1s faster |

---

## Note on OG Images

Social platforms (Facebook, Twitter, LinkedIn) **prefer JPEG for OG images**.
Keep the `.jpg` version for `og:image` meta tag, but optimize it:

1. Resize to exactly 1200×630 pixels
2. Compress with 80% quality
3. Target ~100-150 KB
