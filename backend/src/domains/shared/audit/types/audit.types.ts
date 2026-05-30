export type AuditResult = 'success' | 'failure' | 'denied';

export interface AuditEntry {
  actorId?: string;
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  result: AuditResult;
  ipPrefix?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}
