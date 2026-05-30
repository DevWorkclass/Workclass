/**
 * Repository tickets — Prisma. STUB v1.
 */
import type { Ticket } from '../types/tickets.types.js';

export const ticketRepository = {
  async create(_data: Omit<Ticket, 'createdAt'>): Promise<Ticket> {
    throw new Error('Not implemented — ÉTAPE 3 backend');
  },
  async findById(_id: string): Promise<Ticket | null> {
    throw new Error('Not implemented — ÉTAPE 3 backend');
  },
  async findByBookingId(_bookingId: string): Promise<Ticket | null> {
    throw new Error('Not implemented — ÉTAPE 3 backend');
  },
  async markScanned(_id: string, _scannedAt: Date): Promise<void> {
    throw new Error('Not implemented — ÉTAPE 3 backend');
  },
};
