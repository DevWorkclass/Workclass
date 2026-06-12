/**
 * Types du domaine booking.
 */

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/** Un participant individuel (une place = une personne). */
export interface ParticipantInfo {
  firstName: string;
  lastName: string;
  email?: string;
}

export interface BookingOption {
  name: string;
  price: number;
}

export interface BookingInput {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  /** Numéro mobile money du payeur (obligatoire). */
  payerPhone: string;
  /** Nom complet du payeur (optionnel). */
  payerName?: string;
  /** Email du payeur — adresse où le billet sera envoyé. */
  payerEmail?: string;
  /** Adresse postale (optionnel, non utilisé pour l'envoi). */
  payerAddress?: string;
  /** Un participant par place réservée. */
  participants: ParticipantInfo[];
  options?: BookingOption[];
}

export interface Booking {
  id: string;
  eventId: string;
  reference: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
