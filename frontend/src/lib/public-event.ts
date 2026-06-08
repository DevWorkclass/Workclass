/**
 * Type des événements publics (renvoyés par GET /api/public/events).
 */

export interface PublicTicketType {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  quota: number;
  soldCount: number;
}

export interface PublicProgramItem {
  time?: string;
  title: string;
  description?: string;
}

export interface PublicSpeaker {
  name: string;
  role?: string;
}

export interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  recommendations: string | null;
  program: PublicProgramItem[];
  speakers: PublicSpeaker[];
  ticketTypes: PublicTicketType[];
  seatsTotal: number;
  seatsSold: number;
  seatsAvailable: number;
}

/** Formate une plage de dates lisible (fr-FR). */
export function formatEventRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
  const s = new Date(start).toLocaleDateString('fr-FR', opts);
  const e = new Date(end).toLocaleDateString('fr-FR', opts);
  return s === e ? s : `${s} → ${e}`;
}
