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
        quantity: data.quantity,
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

  /**
   * Réserve atomiquement `quantity` places : incrémente `sold` seulement si
   * `sold + quantity <= quota`. Renvoie `true` si les places sont réservées,
   * `false` si le quota restant est insuffisant.
   * Une seule instruction SQL → compatible pgBouncer (pas de transaction interactive).
   */
  async claimQuota(ticketTypeId: string, quantity: number): Promise<boolean> {
    const affected = await prisma.$executeRaw`
      UPDATE ticket_types SET sold_count = sold_count + ${quantity}
      WHERE id = ${ticketTypeId} AND sold_count + ${quantity} <= quota
    `;
    return affected > 0;
  }

  /** Libère `quantity` places réservées (compensation / annulation). */
  async releaseQuota(ticketTypeId: string, quantity: number): Promise<void> {
    await prisma.$executeRaw`
      UPDATE ticket_types SET sold_count = GREATEST(sold_count - ${quantity}, 0)
      WHERE id = ${ticketTypeId}
    `;
  }

  /**
   * Récupère toutes les réservations correspondant aux filtres, sans pagination,
   * pour génération d'un export (CSV/PDF). Inclut participant, event, billet.
   */
  async findForExport(params: { status?: BookingStatus; eventId?: string }) {
    const where: Prisma.BookingWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.eventId) where.eventId = params.eventId;
    return prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { participant: true, event: true, ticketType: true, ticket: true },
    });
  }

  async findAll(params: { page?: number; limit?: number; status?: BookingStatus; eventId?: string }) {
    const { page = 1, limit = 20, status, eventId } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.BookingWhereInput = {};
    if (status) where.status = status;
    if (eventId) where.eventId = eventId;
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
