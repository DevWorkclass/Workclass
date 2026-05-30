/**
 * Seed Work Class Gabon — données de démarrage idempotentes.
 *
 * Crée (via upsert sur UUID fixes) :
 *  - 1 événement publié `Work Class Gabon 2026`
 *  - 2 types de billets (Standard / VIP)
 *  - 1 admin super_admin (mot de passe lu depuis SEED_ADMIN_PASSWORD ou défaut DEV)
 *
 * Exécution : `npm run db:seed` (cf. backend/package.json).
 * IDEMPOTENT : peut être relancé sans dupliquer.
 *
 * ⚠️ Le mot de passe par défaut est destiné UNIQUEMENT au dev local —
 *    fournir `SEED_ADMIN_PASSWORD` en staging/prod.
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, EventStatus, AdminRole } from '@prisma/client';

const EVENT_ID = '00000000-0000-0000-0000-000000000001';
const TICKET_STANDARD_ID = '00000000-0000-0000-0000-000000000010';
const TICKET_VIP_ID = '00000000-0000-0000-0000-000000000011';
const ADMIN_EMAIL = 'admin@workclass-gabon.com';
const BCRYPT_ROUNDS = 12;

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    // --- Événement principal ---
    const event = await prisma.event.upsert({
      where: { id: EVENT_ID },
      update: {},
      create: {
        id: EVENT_ID,
        title: 'Work Class Gabon 2026',
        slug: 'work-class-gabon-2026',
        description:
          "Conférence annuelle Work Class Gabon — réseau, masterclass et opportunités professionnelles.",
        location: 'Libreville, Gabon',
        startDate: new Date('2026-09-15T09:00:00+01:00'),
        endDate: new Date('2026-09-16T18:00:00+01:00'),
        status: EventStatus.published,
        program: [
          { time: '09:00', title: 'Accueil & check-in' },
          { time: '10:00', title: "Keynote d'ouverture" },
          { time: '14:00', title: 'Masterclass Leadership' },
        ],
        speakers: [
          { name: 'Speaker Un', role: 'CEO Work Class' },
          { name: 'Speaker Deux', role: 'Mentor' },
        ],
      },
    });

    // --- Types de billets ---
    await prisma.ticketType.upsert({
      where: { id: TICKET_STANDARD_ID },
      update: {},
      create: {
        id: TICKET_STANDARD_ID,
        eventId: event.id,
        name: 'Pass Standard',
        description: 'Accès aux deux journées + supports numériques',
        price: 50000,
        currency: 'XAF',
        quota: 200,
        isActive: true,
      },
    });

    await prisma.ticketType.upsert({
      where: { id: TICKET_VIP_ID },
      update: {},
      create: {
        id: TICKET_VIP_ID,
        eventId: event.id,
        name: 'Pass VIP',
        description: 'Pass Standard + déjeuner VIP + rencontre privée avec les speakers',
        price: 100000,
        currency: 'XAF',
        quota: 50,
        isActive: true,
      },
    });

    // --- Admin super_admin ---
    const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe_DEV_2026!';
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const admin = await prisma.admin.upsert({
      where: { email: ADMIN_EMAIL },
      update: { passwordHash, isActive: true, role: AdminRole.super_admin },
      create: {
        email: ADMIN_EMAIL,
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        role: AdminRole.super_admin,
        isActive: true,
      },
    });

    // eslint-disable-next-line no-console
    console.log('[seed] Terminé.', {
      eventId: event.id,
      ticketStandardId: TICKET_STANDARD_ID,
      ticketVipId: TICKET_VIP_ID,
      adminId: admin.id,
      adminPasswordSource: process.env.SEED_ADMIN_PASSWORD
        ? 'env:SEED_ADMIN_PASSWORD'
        : 'default(dev)',
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed]', err);
  process.exit(1);
});
