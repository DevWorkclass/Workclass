/**
 * Repository booking — accès données via Prisma.
 * STUB v1 : signatures prêtes, implémentations en ÉTAPE 2.
 */

import type { Booking, BookingInput } from '../types/booking.types.js';

export interface BookingRepository {
  create(input: BookingInput, reference: string): Promise<Booking>;
  findByReference(reference: string): Promise<Booking | null>;
  countByTicketType(ticketTypeId: string): Promise<number>;
}

export const bookingRepository: BookingRepository = {
  async create(_input, _reference) {
    throw new Error('Not implemented — ÉTAPE 2 backend');
  },
  async findByReference(_reference) {
    throw new Error('Not implemented — ÉTAPE 2 backend');
  },
  async countByTicketType(_ticketTypeId) {
    throw new Error('Not implemented — ÉTAPE 2 backend');
  },
};
