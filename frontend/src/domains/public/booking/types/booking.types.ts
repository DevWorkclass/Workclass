/**
 * Types du domaine `booking` (public).
 * Réservation = pivot entre événement, type de billet et participant.
 */

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface BookingOption {
  name: string;
  price: number;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  currency: string;
  /** Étiquette mise en avant (ex. "Best"). */
  badge?: string;
  features: string[];
}

export interface ParticipantData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  position?: string;
}

export interface Booking {
  id: string;
  eventId: string;
  ticketTypeId: string;
  reference: string; // Format WCG-RES-XXXXXX
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  currency: string;
  options: BookingOption[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingInput {
  eventId: string;
  ticketTypeId: string;
  participant: ParticipantData;
  options?: BookingOption[];
  consentGiven: boolean;
}

export interface BookingWithDetails extends Booking {
  participant: ParticipantData;
  eventTitle: string;
  ticketTypeName: string;
}
