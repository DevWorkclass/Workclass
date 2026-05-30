/**
 * Repository booking — accès Prisma.
 */

import type { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import type { BookingInput } from '../types/booking.types';

export class BookingRepository {
  /**
   * Crée une réservation + son participant en transaction implicite (nested write).
   */
  async create(
    data: BookingInput & { reference: string; totalAmount: number },
  ) {
    return prisma.booking.create({
      data: {
        eventId: data.eventId,
        ticketTypeId: data.ticketTypeId,
        reference: data.reference,
        status: 'pending',
        paymentStatus: 'pending',
        totalAmount: data.totalAmount,
        options: (data.options ?? []) as unknown as Prisma.InputJsonValue,
        participant: {
          create: {
            firstName: data.participant.firstName,
            lastName: data.participant.lastName,
            email: data.participant.email,
            phone: data.participant.phone,
            company: data.participant.company,
            position: data.participant.position,
            consentGiven: true,
            consentAt: new Date(),
          },
        },
      },
      include: { participant: true },
    });
  }

  async findByReference(reference: string) {
    return prisma.booking.findUnique({
      where: { reference },
      include: { participant: true, ticket: true, event: true, ticketType: true },
    });
  }

  async findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: { participant: true, ticket: true, event: true, ticketType: true },
    });
  }

  async updateStatus(id: string, status: BookingStatus) {
    return prisma.booking.update({
      where: { id },
      data: { status },
      include: { participant: true },
    });
  }

  /**
   * Compte les réservations actives (non-annulées) pour un type de billet.
   * Utilisé pour vérifier le quota avant création.
   */
  async countActiveForTicketType(ticketTypeId: string): Promise<number> {
    return prisma.booking.count({
      where: { ticketTypeId, status: { not: 'cancelled' } },
    });
  }

  async findAll(params: { page?: number; limit?: number; status?: BookingStatus }) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.BookingWhereInput = status ? { status } : {};
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { participant: true, event: true, ticketType: true },
      }),
      prisma.booking.count({ where }),
    ]);
    return { bookings, total };
  }
}
