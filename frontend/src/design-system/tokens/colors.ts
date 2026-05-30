/**
 * Tokens de couleur — Work Class Gabon v1.
 * À garder en sync avec `tailwind.config.ts` et `styles/variables.css`.
 */

export const colors = {
  brand: {
    primary: '#0066CC',
    primaryHover: '#0052A3',
    secondary: '#FF6B00',
    secondaryHover: '#CC5500',
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
