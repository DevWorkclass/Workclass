/**
 * Données de test pour le développement local UI.
 * NE PAS utiliser en production — privilégier les fixtures Supabase (seed.sql).
 */

import type { Event } from '@/domains/public/event/types/event.types';
import type { TicketType } from '@/domains/public/booking/types/booking.types';
import type { Participant } from '@/domains/public/participant/types/participant.types';
import type { Ticket } from '@/domains/admin/tickets/types/tickets.types';

export const MOCK_EVENT: Event = {
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Workclass Commerce International Gabon 2026',
  slug: 'workclass-commerce-international-gabon-2026',
  description:
    "Permettre aux agripreneurs et coopératives gabonaises d'intégrer chaque étape de la chaîne d'exportation agricole — de la structuration du projet à la maîtrise des instruments réglementaires — pour gagner en compétitivité sur les marchés africains et internationaux.",
  location: 'CCAIM · Libreville',
  startDate: new Date('2026-07-04T08:45:00+01:00'),
  endDate: new Date('2026-07-04T12:45:00+01:00'),
  status: 'published',
  program: [
    { time: '08:45', title: "Accueil & ouverture" },
    { time: '09:00', title: "Module 01 · L'agripreneur et sa structure" },
    { time: '10:15', title: 'Module 02 · La réglementation selon les destinations' },
    { time: '11:30', title: 'Module 03 · Transport, emballage & Incoterms' },
  ],
  speakers: [
    { name: 'Valérie Benquet', role: 'EC DOUANE & IDELO' },
    { name: 'Pauline White', role: '2NY Consulting' },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_TICKET_TYPES: TicketType[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: 35000,
    currency: 'FCFA',
    features: [
      'Toutes les conférences',
      'Déjeuner Jour 1',
      'Certificat de participation',
      'Kit participant',
    ],
  },
  {
    id: 'vip-premium',
    name: 'VIP Premium',
    price: 75000,
    currency: 'FCFA',
    badge: 'Best',
    features: [
      'Tout Standard inclus',
      'Places premier rang',
      'Cocktail VIP exclusif',
      'Certificat premium encadré',
    ],
  },
];

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
