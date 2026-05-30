/**
 * Génération QR code (côté serveur uniquement).
 * Le payload est signé HMAC-SHA256 avant encodage.
 * STUB v1 : implémentation en ÉTAPE 3 avec `qrcode`.
 */

import { hmacSha256 } from './crypto.js';
import { env } from '../config/env.js';
import type { QRData } from '../domains/tickets/types/tickets.types.js';

/**
 * Signe un ticketId et retourne le payload JSON sérialisé.
 */
export function buildSignedQRPayload(ticketId: string): string {
  if (!env.QR_HMAC_SECRET) {
    throw new Error('QR_HMAC_SECRET manquant — impossible de signer le QR.');
  }
  const signature = hmacSha256(ticketId, env.QR_HMAC_SECRET);
  const data: QRData = { ticketId, signature };
  return JSON.stringify(data);
}

/**
 * Vérifie un payload QR (parse + vérification HMAC).
 */
export function parseAndVerifyQRPayload(payload: string): QRData | null {
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as { ticketId?: unknown }).ticketId !== 'string' ||
      typeof (parsed as { signature?: unknown }).signature !== 'string'
    ) {
      return null;
    }
    return parsed as QRData;
  } catch {
    return null;
  }
}

/**
 * Génère l'image PNG du QR.
 * TODO ÉTAPE 3 : utiliser `qrcode` (Node) → Buffer PNG / DataURL.
 */
export async function renderQRImage(_payload: string): Promise<Buffer> {
  throw new Error('Not implemented — ÉTAPE 3 backend (utilise `qrcode`).');
}
