/**
 * Service email — wrapper Resend (ou Mailgun).
 * STUB v1 : implémentation en ÉTAPE 4.
 */

import type { EmailPayload, EmailSendResult } from '../types/notifications.types.js';

export const emailService = {
  async send<T>(_payload: EmailPayload<T>): Promise<EmailSendResult> {
    // TODO ÉTAPE 4 :
    //  1. Sélectionner template selon locale + template
    //  2. Rendre HTML + texte
    //  3. Appeler Resend SDK (RESEND_API_KEY)
    //  4. Audit log (sans email en clair)
    throw new Error('Not implemented — ÉTAPE 4 backend');
  },
};
