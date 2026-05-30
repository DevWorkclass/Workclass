/**
 * Helpers responsives — abstractions au-dessus de `window.matchMedia`.
 * À utiliser dans des hooks (useResponsive) côté client uniquement.
 */

import { breakpoints, type Breakpoint } from '@/design-system/tokens/breakpoints';

export function mediaQuery(min: Breakpoint): string {
  return `(min-width: ${breakpoints[min]})`;
}

export function isAboveBreakpoint(width: number, breakpoint: Breakpoint): boolean {
  const px = parseInt(breakpoints[breakpoint], 10);
  return width >= px;
}
