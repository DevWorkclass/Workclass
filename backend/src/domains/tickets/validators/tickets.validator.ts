import { z } from 'zod';

export const ticketGenerateSchema = z.object({
  bookingId: z.string().uuid(),
});

export const ticketGetSchema = z.object({
  ticketId: z.string().uuid(),
});
