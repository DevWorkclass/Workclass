/**
 * Helpers d'accessibilité (a11y).
 */

/**
 * Génère un ID unique stable pour lier label ↔ champ (aria-labelledby, etc.).
 */
export function makeFieldId(prefix: string, suffix: string): string {
  return `wcg-${prefix}-${suffix}`;
}

/**
 * Construit un attribut `aria-describedby` à partir d'IDs optionnels.
 */
export function ariaDescribedBy(...ids: Array<string | undefined>): string | undefined {
  const filtered = ids.filter((id): id is string => Boolean(id));
  return filtered.length > 0 ? filtered.join(' ') : undefined;
}

/**
 * Indique si l'utilisateur préfère le mouvement réduit.
 * À appeler côté client uniquement.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
