import { prisma } from '../../../config/database';
import type { Prisma } from '@prisma/client';

export class EventsRepository {
  async create(data: Prisma.EventCreateInput) {
    return prisma.event.create({
      data,
    });
  }

  async findBySlug(slug: string) {
    return prisma.event.findUnique({
      where: { slug },
    });
  }

  async findAll() {
    return prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        ticketTypes: {
          orderBy: { price: 'asc' },
          select: { id: true, name: true, description: true, price: true, quota: true, soldCount: true },
        },
      },
    });
  }

  /** Événements publiés (vue publique : programme, intervenants, billets). */
  async findPublished() {
    return prisma.event.findMany({
      where: { status: 'published' },
      orderBy: { startDate: 'asc' },
      include: {
        ticketTypes: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
          select: { id: true, name: true, description: true, price: true, quota: true, soldCount: true },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        ticketTypes: { select: { quota: true, soldCount: true } },
        _count: { select: { bookings: true } },
      },
    });
  }

  async update(id: string, data: Prisma.EventUpdateInput) {
    return prisma.event.update({ where: { id }, data });
  }

  async remove(id: string) {
    return prisma.event.delete({ where: { id } });
  }

  async createTicketType(
    eventId: string,
    data: { name: string; description: string | null; price: number; quota: number },
  ) {
    return prisma.ticketType.create({ data: { eventId, ...data } });
  }

  async updateTicketType(
    id: string,
    data: { name: string; description: string | null; price: number; quota: number },
  ) {
    return prisma.ticketType.update({ where: { id }, data });
  }
}
