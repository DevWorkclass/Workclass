/**
 * Utilitaires cryptographiques.
 *  - HMAC-SHA256 (signature QR + tokens).
 *  - Vérification HMAC en temps constant (timingSafeEqual).
 *  - Génération de tokens sécurisés (hex).
 *  - Anonymisation IP (RGPD).
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const HMAC_SECRET =
  process.env.QR_HMAC_SECRET ?? process.env.JWT_SECRET ?? 'dev_secret';

/**
 * Génère une signature HMAC-SHA256 (hex) de `data`.
 */
export function generateHMAC(data: string): string {
  return createHmac('sha256', HMAC_SECRET).update(data, 'utf8').digest('hex');
}

/**
 * Vérifie une signature HMAC en temps constant.
 */
export function verifyHMAC(data: string, signature: string): boolean {
  try {
    const expected = generateHMAC(data);
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(signature, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Génère un token aléatoire hex (par défaut 64 caractères = 32 octets).
 */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Anonymise une IPv4/IPv6 (RGPD : ne stocker que le préfixe).
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
