/**
 * Types admin pour la gestion des réservations.
 */

import type {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '@/domains/public/booking/types/booking.types';

export interface AdminBookingFilters {
  eventId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminBookingListItem extends Booking {
  participantFullName: string;
  participantEmail: string;
  eventTitle: string;
  ticketTypeName: string;
}

export interface AdminBookingAction {
  bookingId: string;
  action: 'validate' | 'cancel' | 'mark_paid' | 'refund';
  reason?: string;
}
