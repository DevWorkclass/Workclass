/**
 * Utilitaires cryptographiques.
 *  - HMAC-SHA256 pour signer/vérifier QR et tokens.
 *  - Random tokens base32 sans ambiguïtés (références, feedback tokens).
 *  - Anonymisation IP (RGPD).
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const BOOKING_REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function hmacSha256(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data, 'utf8').digest('hex');
}

export function verifyHmac(data: string, signature: string, secret: string): boolean {
  const expected = hmacSha256(data, secret);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Génère un suffixe de référence (6 chars) sans ambiguïtés (0/O, 1/I retirés).
 */
export function generateBookingReferenceSuffix(): string {
  const bytes = randomBytes(6);
  let out = '';
  for (let i = 0; i < 6; i++) {
    // Use the byte length as the divisor (safe — 32-byte alphabet).
    const byte = bytes[i] ?? 0;
    const idx = byte % BOOKING_REF_ALPHABET.length;
    out += BOOKING_REF_ALPHABET[idx];
  }
  return out;
}

export function generateBookingReference(): string {
  return `WCG-RES-${generateBookingReferenceSuffix()}`;
}

/**
 * Token URL-safe (feedback links) — 32 bytes base64url.
 */
export function generateUrlSafeToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Anonymise une IPv4 ou IPv6 (RGPD).
 */
export function anonymizeIp(ip: string): string {
  if (!ip) return '';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.x.x`;
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 3).join(':')}::/48`;
  }
  return 'unknown';
}
