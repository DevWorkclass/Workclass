/**
 * Types du domaine booking (backend).
 */

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface ParticipantData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  position?: string;
}

export interface BookingOption {
  name: string;
  price: number;
}

export interface Booking {
  id: string;
  eventId: string;
  ticketTypeId: string;
  reference: string; // WCG-RES-XXXXXX
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingInput {
  eventId: string;
  ticketTypeId: string;
  participant: ParticipantData;
  options?: BookingOption[];
  consentGiven: true;
}

export interface BookingLookupInput {
  reference: string;
}
