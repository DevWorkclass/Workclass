/**
 * Service audit — écrit dans `audit_logs` via Prisma.
 * STUB v1 : implémentation en ÉTAPE 2 (utilise Prisma client).
 */

import type { AuditEntry } from '../types/audit.types.js';

export const auditService = {
  async log(_entry: AuditEntry): Promise<void> {
    // TODO ÉTAPE 2 : prisma.auditLog.create({ data: ... })
    //  - Anonymiser ipPrefix (utils/crypto.anonymizeIp)
    //  - Ne JAMAIS persister email/phone en clair dans metadata
  },
};
