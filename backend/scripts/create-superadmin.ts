/**
 * Crée (ou met à jour) un super_admin dans la table `admins` en réutilisant un
 * UID DÉJÀ existant côté Supabase Authentication.
 *
 * Le `id` de la ligne `admins` est forcé à l'UID Supabase (au lieu d'un uuid auto),
 * pour aligner l'identité applicative sur l'identité d'authentification.
 *
 * IDEMPOTENT : relançable. Upsert sur l'`id` (UID) ; si l'email existe déjà sur
 * une autre ligne, le script s'arrête proprement (contrainte unique email).
 *
 * Le mot de passe N'EST JAMAIS en dur : la connexion backend (JWT) compare un
 * hash bcrypt stocké en base, indépendant du mot de passe Supabase Auth.
 *
 * Variables d'environnement :
 *   SUPERADMIN_UID       (requis)  UID Supabase Auth (uuid v4) → devient admins.id
 *   SUPERADMIN_EMAIL     (requis)  email du compte
 *   SUPERADMIN_PASSWORD  (requis)  mot de passe (≥ 10 caractères) → hashé bcrypt
 *   SUPERADMIN_FIRSTNAME (option)  prénom
 *   SUPERADMIN_LASTNAME  (option)  nom
 *
 * Exécution (depuis backend/) :
 *   SUPERADMIN_UID="<uid>" SUPERADMIN_EMAIL="x@y.z" SUPERADMIN_PASSWORD="********" \
 *     npx tsx scripts/create-superadmin.ts
 *
 * PowerShell :
 *   $env:SUPERADMIN_UID="<uid>"; $env:SUPERADMIN_EMAIL="x@y.z";
 *   $env:SUPERADMIN_PASSWORD="********"; npx tsx scripts/create-superadmin.ts
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, AdminRole } from '@prisma/client';

const BCRYPT_ROUNDS = 12;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variable d'environnement requise manquante : ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const uid = requireEnv('SUPERADMIN_UID');
  const email = requireEnv('SUPERADMIN_EMAIL');
  const password = requireEnv('SUPERADMIN_PASSWORD');
  const firstName = process.env.SUPERADMIN_FIRSTNAME?.trim() || null;
  const lastName = process.env.SUPERADMIN_LASTNAME?.trim() || null;

  if (!UUID_RE.test(uid)) {
    throw new Error(`SUPERADMIN_UID n'est pas un UUID valide : "${uid}"`);
  }
  if (password.length < 10) {
    throw new Error('SUPERADMIN_PASSWORD trop court (10 caractères minimum).');
  }

  const prisma = new PrismaClient();
  try {
    // Garde-fou : l'email ne doit pas appartenir à une AUTRE ligne que cet UID.
    const byEmail = await prisma.admin.findUnique({ where: { email } });
    if (byEmail && byEmail.id !== uid) {
      throw new Error(
        `L'email ${email} est déjà utilisé par le compte ${byEmail.id} ` +
          `(différent de l'UID fourni ${uid}). Aucune modification effectuée.`,
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const admin = await prisma.admin.upsert({
      where: { id: uid },
      update: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: AdminRole.super_admin,
        isActive: true,
        // super_admin a toutes les permissions implicitement → tableau vide.
        permissions: [],
      },
      create: {
        id: uid,
        email,
        passwordHash,
        firstName,
        lastName,
        role: AdminRole.super_admin,
        isActive: true,
        permissions: [],
      },
    });

    // eslint-disable-next-line no-console
    console.log('[create-superadmin] OK', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[create-superadmin]', err instanceof Error ? err.message : err);
  process.exit(1);
});
