/**
 * Carte de présentation d'un billet. Squelette — à implémenter.
 */
import type { Ticket } from '@/domains/admin/tickets/types/tickets.types';

interface TicketCardProps {
  ticket: Pick<Ticket, 'ticketNumber' | 'scannedAt'>;
}

export function TicketCard(_props: TicketCardProps) {
  return null;
}
