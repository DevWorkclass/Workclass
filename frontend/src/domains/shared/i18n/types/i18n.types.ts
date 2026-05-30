/**
 * Types du domaine `i18n` (partagé).
 */

export type Locale = 'fr' | 'en';

export interface LocaleConfig {
  code: Locale;
  label: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export interface TranslationNamespace {
  common: Record<string, string>;
  booking: Record<string, string>;
  event: Record<string, string>;
  admin: Record<string, string>;
  errors: Record<string, string>;
}
