/**
 * Repository users — accès Prisma au modèle Admin (table `admins`).
 * Ne renvoie jamais `passwordHash` (sélection explicite via `publicSelect`).
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';

const publicSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  permissions: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.AdminSelect;

export class UsersRepository {
  findByEmail(email: string) {
    return prisma.admin.findUnique({ where: { email } });
  }

  /** Renvoie l'admin complet (avec passwordHash) — usage interne (login). */
  findByIdRaw(id: string) {
    return prisma.admin.findUnique({ where: { id } });
  }

  findPublicById(id: string) {
    return prisma.admin.findUnique({ where: { id }, select: publicSelect });
  }

  create(data: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    role: 'admin' | 'super_admin';
    permissions: string[];
  }) {
    return prisma.admin.create({ data, select: publicSelect });
  }

  update(id: string, data: Prisma.AdminUpdateInput) {
    return prisma.admin.update({ where: { id }, data, select: publicSelect });
  }

  touchLastLogin(id: string) {
    return prisma.admin.update({
      where: { id },
      data: { lastLoginAt: new Date() },
      select: publicSelect,
    });
  }

  async findAll(params: { page?: number; limit?: number; role?: string }) {
    const { page = 1, limit = 20, role } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.AdminWhereInput =
      role === 'admin' || role === 'super_admin' ? { role } : {};
    const [users, total] = await Promise.all([
      prisma.admin.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: publicSelect,
      }),
      prisma.admin.count({ where }),
    ]);
    return { users, total };
  }
}
