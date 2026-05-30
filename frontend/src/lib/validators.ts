/**
 * Schémas Zod réutilisables pour la validation côté client et serveur.
 */

import { z } from 'zod';

export const emailSchema = z.string().email('Email invalide');

export const phoneSchema = z
  .string()
  .regex(/^\+?\d{8,15}$/, 'Numéro de téléphone invalide');

export const bookingReferenceSchema = z
  .string()
  .regex(/^WCG-RES-[A-Z0-9]{6}$/, 'Référence de réservation invalide');

export const ticketNumberSchema = z
  .string()
  .regex(/^WCG-\d{4}-\d{6}$/, 'Numéro de billet invalide');

export const uuidSchema = z.string().uuid('Identifiant invalide');

export const participantSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(80),
  lastName: z.string().min(1, 'Nom requis').max(80),
  email: emailSchema,
  phone: phoneSchema,
  company: z.string().max(120).optional(),
  position: z.string().max(120).optional(),
});

export const bookingInputSchema = z.object({
  eventId: uuidSchema,
  ticketTypeId: uuidSchema,
  participant: participantSchema,
  options: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().nonnegative(),
      }),
    )
    .optional(),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'Le consentement est obligatoire' }),
  }),
});

export type ParticipantSchema = z.infer<typeof participantSchema>;
export type BookingInputSchema = z.infer<typeof bookingInputSchema>;
