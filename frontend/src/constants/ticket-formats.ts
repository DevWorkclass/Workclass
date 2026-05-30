/**
 * Format des numéros de billet et références de réservation.
 * Format billet : WCG-YYYY-NNNNNN (ex: WCG-2026-000123)
 * Format réservation : WCG-RES-XXXXXX (6 chars alphanumériques uppercase)
 */

export const TICKET_FORMAT = {
  prefix: 'WCG',
  year: new Date().getFullYear(),
  padding: 6,
  separator: '-',
} as const;

export const BOOKING_REFERENCE_FORMAT = {
  prefix: 'WCG-RES',
  length: 6,
  alphabet: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // Ambiguïtés retirées (0/O, 1/I)
} as const;

/**
 * Génère un numéro de billet à partir d'un numéro séquentiel.
 * @example generateTicketNumber(123) -> "WCG-2026-000123"
 */
export function generateTicketNumber(sequence: number): string {
  const { prefix, year, padding, separator } = TICKET_FORMAT;
  const paddedSequence = sequence.toString().padStart(padding, '0');
  return `${prefix}${separator}${year}${separator}${paddedSequence}`;
}

/**
 * Vérifie qu'une chaîne respecte le format `WCG-YYYY-NNNNNN`.
 */
export function isValidTicketNumber(value: string): boolean {
  return /^WCG-\d{4}-\d{6}$/.test(value);
}

/**
 * Vérifie qu'une chaîne respecte le format `WCG-RES-XXXXXX`.
 */
export function isValidBookingReference(value: string): boolean {
  return /^WCG-RES-[A-Z0-9]{6}$/.test(value);
}
