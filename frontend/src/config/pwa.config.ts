/**
 * Configuration PWA — manifest et service worker.
 */

export const pwaConfig = {
  name: 'Work Class Gabon',
  shortName: 'WCG',
  description: 'Plateforme de réservation et gestion d\'événements professionnels.',
  themeColor: '#0066CC',
  backgroundColor: '#FFFFFF',
  display: 'standalone' as const,
  startUrl: '/',
  scope: '/',
  cacheNamespace: 'wcg-cache-v1',
  precacheRoutes: ['/', '/reservation', '/participant'],
} as const;
