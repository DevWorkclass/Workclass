/**
 * Constantes i18n partagées (sûres pour l'edge runtime / middleware).
 * Pas d'import next-intl ici.
 */
export const locales = ['fr', 'en'] as const;
export const defaultLocale = 'fr' as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
