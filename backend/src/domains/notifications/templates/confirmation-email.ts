/**
 * Template email — Confirmation de réservation.
 * À enrichir avec React Email en ÉTAPE 4.
 */

export interface ConfirmationEmailData {
  participantFirstName: string;
  reference: string;
  eventTitle: string;
  eventDate: string;
}

export function renderConfirmationEmail(_data: ConfirmationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  throw new Error('Not implemented — ÉTAPE 4 backend');
}
