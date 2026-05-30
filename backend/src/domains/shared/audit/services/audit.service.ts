/**
 * Service d'audit — persiste les actions sensibles dans `audit_logs`.
 *
 * Mapping vers le schéma Prisma `AuditLog` :
 *   userId  → actorId
 *   resource → resourceType
 *   ip      → ipPrefix (anonymisé)
 *
 * Ne JAMAIS passer email / téléphone en clair dans `details`.
 */

import { prisma } from '../../../../config/database';
import { logger } from '../../../../utils/logger';
import { anonymizeIp } from '../../../../utils/crypto';

interface AuditLogInput {
  action: string;
  userId?: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  result: 'success' | 'failure' | 'denied';
}

export async function logAudit(data: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: data.userId,
        action: data.action,
        resourceType: data.resource,
        resourceId: data.resourceId,
        result: data.result,
        ipPrefix: data.ip ? anonymizeIp(data.ip) : undefined,
        userAgent: data.userAgent,
        metadata: (data.details ?? {}) as object,
      },
    });
  } catch (error) {
    // Ne pas casser le flow métier si l'audit échoue : on log seulement.
    logger.error({ err: error }, 'Erreur audit log');
  }
}
