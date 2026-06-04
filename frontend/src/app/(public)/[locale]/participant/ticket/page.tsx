/**
 * Page billet participant.
 *
 * Données: mock local (MOCK_*). Le branchement réel récupérera le billet via
 * POST /api/tickets/get (données sensibles — jamais en GET avec ref/id en clair).
 */
import type { Metadata } from 'next';

import { MOCK_EVENT, MOCK_PARTICIPANT, MOCK_TICKET } from '@/data/mockData';
import { TicketView } from '@/domains/public/participant/components/TicketView';

export const metadata: Metadata = {
  title: 'Mon billet — Work Class Gabon',
  description: 'Récapitulatif et QR code de votre billet Work Class Gabon.',
  robots: { index: false, follow: false },
};

export default function ParticipantTicketPage() {
  return <TicketView event={MOCK_EVENT} participant={MOCK_PARTICIPANT} ticket={MOCK_TICKET} />;
}
