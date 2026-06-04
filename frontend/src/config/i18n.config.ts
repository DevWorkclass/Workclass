/**
 * Configuration de requête next-intl (chargée par le plugin dans next.config.js).
 * Résout la locale courante (API `requestLocale`, next-intl ≥ 3.20) et charge
 * les messages correspondants.
 */
import { getRequestConfig } from 'next-intl/server';

import { defaultLocale, isLocale } from './i18n';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
  };
});
