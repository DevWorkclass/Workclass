/**
 * Génération + vérification de QR codes signés HMAC-SHA256.
 * Le payload encodé est un JSON `{ ticketId, signature }`.
 */

import QRCode from 'qrcode';
import { generateHMAC, verifyHMAC } from './crypto';

export interface QRCodeData {
  ticketId: string;
  signature: string;
}

/**
 * Génère une data-URL PNG d'un QR signé pour `ticketId`.
 */
export async function generateQRCode(ticketId: string): Promise<string> {
  const signature = generateHMAC(ticketId);
  const data: QRCodeData = { ticketId, signature };
  return QRCode.toDataURL(JSON.stringify(data), {
    width: 400,
    margin: 2,
    color: { dark: '#0066CC', light: '#FFFFFF' },
  });
}

/**
 * Vérifie qu'un payload QR a une signature HMAC valide.
 */
export function verifyQRCode(data: QRCodeData): boolean {
  return verifyHMAC(data.ticketId, data.signature);
}

/**
 * Génère un QR code « texte simple » (data-URL PNG) — typiquement une URL
 * ouvrable par n'importe quel scanner. Utilisé pour authentifier les certificats.
 */
export async function generatePlainQRCode(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 300,
    margin: 1,
    color: { dark: '#0F172A', light: '#FFFFFF' },
  });
}

/**
 * Parse + vérifie un payload QR brut (chaîne JSON).
 * Retourne le `QRCodeData` si valide, `null` sinon.
 */
export function parseAndVerifyQRPayload(payload: string): QRCodeData | null {
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
    const data = parsed as QRCodeData;
    return verifyQRCode(data) ? data : null;
  } catch {
    return null;
  }
}
