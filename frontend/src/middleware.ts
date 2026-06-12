/**
 * Middleware next-intl — préfixe de locale (/fr, /en) sur les routes publiques.
 * Exclut /admin, /api, les assets et les fichiers statiques.
 */
import createMiddleware from 'next-intl/middleware';

import { defaultLocale, locales } from '@/config/i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Tout sauf: api, _next, _vercel, /admin, /avis (lien email sans locale), et assets.
  matcher: ['/((?!api|_next|_vercel|admin|avis|.*\\..*).*)'],
};
