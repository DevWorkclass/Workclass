/**
 * Schémas Zod du domaine booking.
 */

import { z } from 'zod';

export const participantSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().regex(/^\+?\d{8,15}$/),
  company: z.string().max(120).optional(),
  position: z.string().max(120).optional(),
});

export const bookingOptionSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
});

export const bookingCreateSchema = z.object({
  eventId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  participant: participantSchema,
  options: z.array(bookingOptionSchema).optional(),
  consentGiven: z.literal(true),
});

export const bookingLookupSchema = z.object({
  reference: z.string().regex(/^WCG-RES-[A-Z0-9]{6}$/),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingLookupInput = z.infer<typeof bookingLookupSchema>;
