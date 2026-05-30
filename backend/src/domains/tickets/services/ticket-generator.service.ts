/**
 * Service génération ticket — orchestration métier.
 * STUB v1 : implémentation en ÉTAPE 3.
 */

import type { Ticket, TicketGenerateInput } from '../types/tickets.types.js';

export const ticketGeneratorService = {
  async generate(_input: TicketGenerateInput): Promise<Ticket> {
    // TODO ÉTAPE 3 :
    //  1. Vérifier booking confirmé + payé
    //  2. Générer ticket_number WCG-YYYY-NNNNNN (séquence Postgres)
    //  3. Signer QR { ticketId, signature: HMAC(ticketId, QR_HMAC_SECRET) } (utils/crypto)
    //  4. Générer PDF avec utils/pdf-generator
    //  5. Upload Supabase Storage `documents/tickets/`
    //  6. Persister ticket via repository
    //  7. Enqueue envoi email (notifications)
    throw new Error('Not implemented — ÉTAPE 3 backend');
  },

  async get(_ticketId: string): Promise<Ticket | null> {
    throw new Error('Not implemented — ÉTAPE 3 backend');
  },
};
