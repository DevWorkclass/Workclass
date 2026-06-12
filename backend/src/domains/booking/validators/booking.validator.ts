/**
 * Schémas Zod du domaine booking.
 */

import { z } from 'zod';

export const createBookingSchema = z.object({
  eventId: z.string().uuid('ID evenement invalide'),
  ticketTypeId: z.string().uuid('ID type de billet invalide'),
  quantity: z.number().int().min(1, 'Au moins une place').max(10, 'Maximum 10 places').default(1),
  /** Numéro mobile money du payeur (obligatoire). */
  payerPhone: z.string().regex(/^\+?\d{8,15}$/, 'Telephone payeur invalide'),
  /** Nom complet du payeur (optionnel). */
  payerName: z.string().max(120).optional(),
  /** Email du payeur — adresse où le billet sera envoyé. */
  payerEmail: z.preprocess((v) => v || undefined, z.string().email('Email invalide').optional()),
  /** Adresse postale (optionnel). */
  payerAddress: z.string().max(300).optional(),
  /** Un objet par place réservée (prénom + nom requis, email recommandé). */
  participants: z
    .array(
      z.object({
        firstName: z.string().min(2, 'Prenom participant requis'),
        lastName: z.string().min(2, 'Nom participant requis'),
        email: z.string().email('Email invalide').optional().or(z.literal('')),
      }),
    )
    .min(1, 'Au moins un participant requis')
    .max(10),
  options: z
    .array(z.object({ name: z.string().min(1), price: z.number().min(0) }))
    .optional(),
});

export const bookingReferenceSchema = z.object({
  reference: z.string().regex(/^WCG-RES-[A-Z0-9]{6}$/, 'Reference invalide'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
