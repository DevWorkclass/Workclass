/**
 * Réservation — Étape 1/3 : type de billet.
 * Données: mock local (MOCK_*). Les types de billet et prix faisant foi
 * proviendront du backend (POST création de réservation).
 */
import type { Metadata } from 'next';

import { MOCK_EVENT, MOCK_TICKET_TYPES } from '@/data/mockData';
import { ReservationStep1 } from '@/domains/public/booking/components/ReservationStep1';

export const metadata: Metadata = {
  title: 'Réservez votre place — Work Class Gabon',
  description: 'Choisissez votre type de billet pour Work Class Gabon 2026.',
};

export default function ReservationEtape1Page() {
  return <ReservationStep1 event={MOCK_EVENT} ticketTypes={MOCK_TICKET_TYPES} />;
}
