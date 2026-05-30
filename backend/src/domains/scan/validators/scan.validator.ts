import { z } from 'zod';

export const scanVerifySchema = z.object({
  qrPayload: z.string().min(1),
  scannerId: z.string().uuid().optional(),
});

export const scanConfirmSchema = z.object({
  ticketId: z.string().uuid(),
  scannerId: z.string().uuid().optional(),
});
