/**
 * Configuration next-intl — routing fr/en.
 */

import { getRequestConfig } from 'next-intl/server';

export const SUPPORTED_LOCALES = ['fr', 'en'] as const;
export const DEFAULT_LOCALE = 'fr';

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export default getRequestConfig(async ({ locale }) => {
  const safeLocale = (SUPPORTED_LOCALES as readonly string[]).includes(locale ?? '')
    ? (locale as SupportedLocale)
    : DEFAULT_LOCALE;

  return {
    locale: safeLocale,
    messages: (await import(`@/locales/${safeLocale}.json`)).default,
  };
});
