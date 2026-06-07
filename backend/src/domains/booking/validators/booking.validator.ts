/**
 * Schémas Zod du domaine booking.
 */

import { z } from 'zod';

export const createBookingSchema = z.object({
  eventId: z.string().uuid('ID evenement invalide'),
  ticketTypeId: z.string().uuid('ID type de billet invalide'),
  // Nombre de places reservees (une personne peut en reserver plusieurs).
  quantity: z.number().int().min(1, 'Au moins une place').max(20, 'Maximum 20 places').default(1),
  participant: z.object({
    firstName: z.string().min(2, 'Prenom requis'),
    lastName: z.string().min(2, 'Nom requis'),
    email: z.string().email('Email invalide'),
    phone: z.string().regex(/^\+?\d{8,15}$/, 'Telephone invalide'),
    company: z.string().max(120).optional(),
    position: z.string().max(120).optional(),
  }),
  options: z
    .array(z.object({ name: z.string().min(1), price: z.number().min(0) }))
    .optional(),
});

export const bookingReferenceSchema = z.object({
  reference: z.string().regex(/^WCG-RES-[A-Z0-9]{6}$/, 'Reference invalide'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
