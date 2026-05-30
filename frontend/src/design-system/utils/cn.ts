/**
 * Utilitaire `cn` — fusion de classes Tailwind avec déduplication.
 * Pattern shadcn/ui : `clsx` + `tailwind-merge`.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
