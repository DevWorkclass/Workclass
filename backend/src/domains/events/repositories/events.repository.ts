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
        ticketTypes: { select: { quota: true, soldCount: true } },
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
}
