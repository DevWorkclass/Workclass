/**
 * Service scan — vérification QR + confirmation entrée.
 * STUB v1 : implémentation en ÉTAPE 3.
 */

import type {
  ScanConfirmInput,
  ScanResult,
  ScanVerifyInput,
} from '../types/scan.types.js';

export const scanService = {
  async verify(_input: ScanVerifyInput): Promise<ScanResult> {
    // TODO ÉTAPE 3 :
    //  1. Parser qrPayload → { ticketId, signature }
    //  2. Vérifier HMAC via utils/crypto
    //  3. Récupérer ticket via repository
    //  4. Vérifier scanned_at IS NULL et event actif
    throw new Error('Not implemented — ÉTAPE 3 backend');
  },

  async confirm(_input: ScanConfirmInput): Promise<ScanResult> {
    // TODO ÉTAPE 3 :
    //  1. Marquer ticket.scanned_at = now()
    //  2. Générer certificat PDF
    //  3. Envoyer email avec certificat
    //  4. Audit log
    throw new Error('Not implemented — ÉTAPE 3 backend');
  },
};
