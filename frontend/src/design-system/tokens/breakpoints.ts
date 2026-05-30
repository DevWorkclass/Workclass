/**
 * Breakpoints mobile-first.
 * Doivent rester strictement alignés avec `tailwind.config.ts`.
 */

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;
