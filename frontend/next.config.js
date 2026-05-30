// @ts-check
const createNextIntlPlugin = require('next-intl/plugin');

// Plugin next-intl pour le routing i18n (fr/en)
const withNextIntl = createNextIntlPlugin('./src/config/i18n.config.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // App Router activé par défaut depuis Next 13
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Headers de sécurité (CSP renforcée à compléter via middleware Vercel)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
