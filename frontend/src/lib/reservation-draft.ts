/**
 * Brouillon de réservation partagé entre les étapes (sessionStorage).
 * Évite de faire transiter les données participant dans l'URL.
 */

export interface ReservationParticipant {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  position?: string;
}

export interface ReservationDraft {
  eventId: string;
  eventTitle: string;
  coverImage?: string | null;
  startDate: string;
  endDate: string;
  location: string;
  ticketTypeId: string;
  ticketName: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  participant?: ReservationParticipant;
}

const KEY = 'wcg-reservation-draft';

export function getDraft(): ReservationDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ReservationDraft) : null;
  } catch {
    return null;
  }
}

export function setDraft(draft: ReservationDraft): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function patchDraft(patch: Partial<ReservationDraft>): ReservationDraft | null {
  const current = getDraft();
  if (!current) return null;
  const next = { ...current, ...patch };
  setDraft(next);
  return next;
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}
