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
    });
  }
}
