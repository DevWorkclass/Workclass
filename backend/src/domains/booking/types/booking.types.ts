/**
 * Types du domaine booking.
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

export interface BookingInput {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  participant: ParticipantData;
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
