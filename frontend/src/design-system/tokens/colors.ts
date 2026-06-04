/**
 * Tokens de couleur — Work Class Gabon v1.
 * À garder en sync avec `tailwind.config.ts` et `styles/globals.css` (vars CSS).
 */

export const colors = {
  brand: {
    /** Bleu marine — titres, header, boutons pleins, sections sombres. */
    navy: '#0D2145',
    navyDeep: '#102344',
    navyHover: '#0A1A38',
    /** Doré — accent, CTA, "Summit", éléments billet. */
    gold: '#C8A84B',
    goldHover: '#B5963F',
    goldSoft: 'rgba(200, 168, 75, 0.1)',
    /** Crème — fond de page. */
    cream: '#F4F0E6',
    /** Gris textes secondaires. */
    muted: '#6B7385',
    /** Dégradé carte pass (billet). */
    passFrom: '#0E2450',
    passTo: '#2152B6',
    // Aliases rétro-compat
    primary: '#0D2145',
    primaryHover: '#0A1A38',
    secondary: '#C8A84B',
    secondaryHover: '#B5963F',
  },
  /** Tricolore logo (drapeau Gabon stylisé). */
  logo: {
    teal: '#1CA1AA',
    tealLight: '#79C7CA',
    green: '#24A775',
    greenLight: '#6BBD94',
    yellow: '#ECAB11',
    yellowLight: '#F1C669',
  },
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
  },
} as const;

export type ColorToken = typeof colors;
