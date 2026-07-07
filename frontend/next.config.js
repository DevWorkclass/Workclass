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
  // Headers de sécurité — applicables à toutes les pages (PWA durcie).
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(self), microphone=(), geolocation=()',
      },
      // HSTS : force HTTPS pendant 2 ans, sous-domaines inclus, éligible preload.
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      // Anti-clickjacking complémentaire (compatible navigateurs modernes).
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin',
      },
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-origin',
      },
    ];
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Service worker : pas de cache navigateur — il doit rester mis à jour.
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      // Manifest : cache court pour propager les changements d'icône / nom.
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
