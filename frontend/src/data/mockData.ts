/**
 * Données de test pour le développement local UI.
 * NE PAS utiliser en production — privilégier les fixtures Supabase (seed.sql).
 */

import type { Event } from '@/domains/public/event/types/event.types';

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
