/**
 * Build script to generate config.js from environment variables
 * Run: npm run build (or node scripts/build-config.js)
 */

const fs = require('fs');
const path = require('path');

// Get environment variables with fallbacks for development
const config = {
    supabase: {
        url: process.env.SUPABASE_URL || 'https://vqxviqsvmlevabqihwir.supabase.co',
        anonKey: process.env.SUPABASE_ANON_KEY || ''
    },
    razorpay: {
        key: process.env.RAZORPAY_KEY_ID || ''
    },
    app: {
        name: 'ZapNest Black Box',
        env: process.env.NODE_ENV || 'development'
    }
};

// Validate required keys in production
if (process.env.NODE_ENV === 'production') {
    const missing = [];
    if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
    if (!process.env.SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
    if (!process.env.RAZORPAY_KEY_ID) missing.push('RAZORPAY_KEY_ID');

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing.join(', '));
        process.exit(1);
    }
}

// Generate the config file content
const configContent = `/**
 * ZapNest Configuration
 * Auto-generated at build time - DO NOT EDIT MANUALLY
 * Generated: ${new Date().toISOString()}
 */

window.ZAPNEST_CONFIG = {
  supabase: {
    url: '${config.supabase.url}',
    anonKey: '${config.supabase.anonKey}'
  },
  razorpay: {
    key: '${config.razorpay.key}'
  },
  app: {
    name: '${config.app.name}',
    env: '${config.app.env}'
  }
};

// Legacy compatibility
window.SUPABASE_URL = window.ZAPNEST_CONFIG.supabase.url;
window.SUPABASE_ANON_KEY = window.ZAPNEST_CONFIG.supabase.anonKey;
window.RAZORPAY_KEY = window.ZAPNEST_CONFIG.razorpay.key;
`;

// Write to config.generated.js
const outputPath = path.join(__dirname, '..', 'config.generated.js');
fs.writeFileSync(outputPath, configContent);

console.log('✅ Config generated successfully!');
console.log(`   Environment: ${config.app.env}`);
console.log(`   Output: config.generated.js`);
