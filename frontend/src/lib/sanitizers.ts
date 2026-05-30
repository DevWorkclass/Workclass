/**
 * Sanitizers d'entrées utilisateur.
 * À utiliser AVANT toute persistance / affichage.
 */

/**
 * Supprime espaces multiples et trim.
 */
export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Normalise un email (lowercase + trim).
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Conserve uniquement chiffres et `+` pour les téléphones.
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Slug ASCII safe (lowercase, tirets, sans accents).
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Escape minimal pour insertion HTML (utiliser DOMPurify si HTML riche).
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
