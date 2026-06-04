/**
 * Configuration globale de l'application — lue depuis les variables d'env publiques.
 */

export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? 'Work Class Gabon',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  env: (process.env.NEXT_PUBLIC_APP_ENV ?? 'development') as
    | 'development'
    | 'staging'
    | 'production',
  defaultLocale: (process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'fr') as 'fr' | 'en',
  supportedLocales: ['fr', 'en'] as const,
  contactEmail: 'contact@workclass-gabon.com',
  /** URL de base de l'API backend Express. */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
} as const;

export type AppConfig = typeof appConfig;
