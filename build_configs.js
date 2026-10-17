const fs = require('fs');
const path = require('path');

const tsconfig = {
  "compilerOptions": {
    "target": "es2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
};

fs.writeFileSync(path.join(__dirname, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
};

module.exports = nextConfig;
`;
fs.writeFileSync(path.join(__dirname, 'next.config.js'), nextConfig);

const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
fs.writeFileSync(path.join(__dirname, 'postcss.config.js'), postcssConfig);

const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          dark: '#07090E',
          surface: '#0D111A',
          card: '#121826',
          border: '#1F293D',
          hover: '#1B2436',
          cyan: '#00F0FF',
          emerald: '#10B981',
          crimson: '#EF4444',
          amber: '#F59E0B',
          purple: '#8B5CF6',
          violet: '#6366F1',
          gold: '#FFD700',
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif']
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 240, 255, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
        'glow-crimson': '0 0 25px -5px rgba(239, 68, 68, 0.4)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.4)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite'
      }
    },
  },
  plugins: [],
};
`;
fs.writeFileSync(path.join(__dirname, 'tailwind.config.js'), tailwindConfig);

const envExample = `# ==========================================
# MINDVAULT ENVIRONMENT CONFIGURATION
# ==========================================

# Port and Base URLs
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# ==========================================
# MYSQL 8+ DATABASE (MAIN SOURCE OF TRUTH)
# ==========================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mindvault
DB_CONNECTION_LIMIT=20

# ==========================================
# FIREBASE CLIENT (AUTH & STORAGE)
# ==========================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDummyKeyForClientInit
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mindvault-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mindvault-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mindvault-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# ==========================================
# FIREBASE ADMIN (SERVER TOKEN VERIFICATION)
# ==========================================
FIREBASE_PROJECT_ID=mindvault-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@mindvault-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n"

# Admin Initial Provisioning Key (Optional)
ADMIN_BOOTSTRAP_KEY=mindvault-admin-secret-2026
`;
fs.writeFileSync(path.join(__dirname, '.env.example'), envExample);
fs.writeFileSync(path.join(__dirname, '.env.local'), envExample);

console.log('Configs & env generated successfully.');
