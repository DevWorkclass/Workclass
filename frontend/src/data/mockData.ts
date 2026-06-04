/**
 * Données de test pour le développement local UI.
 * NE PAS utiliser en production — privilégier les fixtures Supabase (seed.sql).
 */

import type { Event } from '@/domains/public/event/types/event.types';
import type { Participant } from '@/domains/public/participant/types/participant.types';
import type { Ticket } from '@/domains/admin/tickets/types/tickets.types';

export const MOCK_EVENT: Event = {
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Work Class Gabon 2026',
  slug: 'work-class-gabon-2026',
  description:
    'Conférence annuelle Work Class Gabon — réseau, masterclass et opportunités professionnelles.',
  location: 'Libreville, Gabon',
  startDate: new Date('2026-09-15T09:00:00+01:00'),
  endDate: new Date('2026-09-16T18:00:00+01:00'),
  status: 'published',
  program: [
    { time: '09:00', title: 'Accueil & check-in' },
    { time: '10:00', title: 'Keynote d\'ouverture' },
  ],
  speakers: [{ name: 'Speaker Un', role: 'CEO Work Class' }],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_PARTICIPANT: Participant = {
  id: '00000000-0000-0000-0000-0000000000a1',
  bookingId: '00000000-0000-0000-0000-0000000000b1',
  firstName: 'Awa',
  lastName: 'Mboumba',
  email: 'awa.mboumba@example.com',
  phone: '+241 06 12 34 56',
  company: 'Gabon Digital SARL',
  position: 'Responsable RH',
  consentGiven: true,
  consentAt: new Date('2026-03-01T10:00:00+01:00'),
  createdAt: new Date('2026-03-01T10:00:00+01:00'),
  updatedAt: new Date('2026-03-01T10:00:00+01:00'),
};

export const MOCK_TICKET: Ticket = {
  id: '00000000-0000-0000-0000-0000000000c1',
  bookingId: MOCK_PARTICIPANT.bookingId,
  ticketNumber: 'WCG-2026-004821',
  // Signature HMAC réelle générée côté backend — placeholder local uniquement.
  qrCode: 'WCG-2026-004821',
  certificateSent: false,
  createdAt: new Date('2026-03-01T10:00:00+01:00'),
  updatedAt: new Date('2026-03-01T10:00:00+01:00'),
};
