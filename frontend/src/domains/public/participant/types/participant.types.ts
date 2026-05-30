/**
 * Types du domaine `participant` (public).
 * Données personnelles soumises au RGPD-like (consentement explicite, droit à l'oubli).
 */

export interface Participant {
  id: string;
  bookingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  position?: string;
  metadata?: Record<string, unknown>;
  consentGiven: boolean;
  consentAt?: Date;
  anonymizedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParticipantPublicView {
  firstName: string;
  lastName: string;
  email: string;
}
