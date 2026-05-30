import { z } from 'zod';

export const feedbackValidateSchema = z.object({
  token: z.string().min(16),
});

export const feedbackSubmitSchema = z.object({
  token: z.string().min(16),
  ratings: z.object({
    overall: z.number().int().min(1).max(5),
    organization: z.number().int().min(1).max(5).optional(),
    content: z.number().int().min(1).max(5).optional(),
    speakers: z.number().int().min(1).max(5).optional(),
    venue: z.number().int().min(1).max(5).optional(),
  }),
  comment: z.string().max(2000).optional(),
});
