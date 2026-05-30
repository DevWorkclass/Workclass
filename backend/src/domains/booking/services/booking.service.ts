/**
 * Service booking — logique métier.
 * STUB v1 : signatures prêtes, implémentations en ÉTAPE 2.
 */

import type {
  Booking,
  BookingInput,
  BookingLookupInput,
} from '../types/booking.types.js';
import { bookingRepository } from '../repositories/booking.repository.js';

export const bookingService = {
  async create(_input: BookingInput): Promise<Booking> {
    // TODO ÉTAPE 2 :
    //  1. Vérifier quota ticket_type via repository
    //  2. Générer reference WCG-RES-XXXXXX (atomique)
    //  3. Insérer booking + participant en transaction Prisma
    //  4. Enqueue génération ticket (BullMQ ou direct)
    //  5. Logger audit (auditService)
    void bookingRepository;
    throw new Error('Not implemented — ÉTAPE 2 backend');
  },

  async lookup(_input: BookingLookupInput): Promise<Booking | null> {
    // TODO ÉTAPE 2 : récupérer booking + participant + ticket
    throw new Error('Not implemented — ÉTAPE 2 backend');
  },
};
