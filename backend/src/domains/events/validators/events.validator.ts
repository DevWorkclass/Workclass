import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères'),
  description: z.string().min(10, 'La description doit faire au moins 10 caractères'),
  location: z.string().min(3, 'Le lieu doit faire au moins 3 caractères'),
  startDate: z.string().datetime({ message: 'Date de début invalide' }),
  endDate: z.string().datetime({ message: 'Date de fin invalide' }),
  coverImage: z.string().url('URL invalide').optional().or(z.literal('')),
  // Recommandations propres à l'événement (texte libre, optionnel).
  recommendations: z.string().max(2000, 'Recommandations trop longues').optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  program: z.array(z.any()).optional().default([]),
  speakers: z.array(z.any()).optional().default([]),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

// Mise à jour : id obligatoire + champs partiels (on ne modifie que ce qui est fourni).
export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string().uuid('ID evenement invalide'),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const deleteEventSchema = z.object({
  id: z.string().uuid('ID evenement invalide'),
});
