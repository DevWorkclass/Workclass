import { z } from 'zod';

// Élément du programme : un créneau (horaire + intitulé + détail optionnel).
export const programItemSchema = z.object({
  time: z.string().max(40).optional().or(z.literal('')),
  title: z.string().min(1, 'Intitulé requis').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
});

// Intervenant : nom + rôle/profession.
export const speakerSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(120),
  role: z.string().max(120).optional().or(z.literal('')),
});

// Type de billet (tarification configurée à la création de l'événement).
export const ticketTypeInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nom requis').max(80),
  description: z.string().max(200).optional().or(z.literal('')),
  price: z.number().min(0, 'Prix invalide'),
  // Nombre de places (permet le décompte après chaque réservation).
  quota: z.number().int().min(1, 'Au moins une place'),
});

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
  program: z.array(programItemSchema).optional().default([]),
  speakers: z.array(speakerSchema).optional().default([]),
  ticketTypes: z.array(ticketTypeInputSchema).min(1, 'Au moins un type de billet').default([]),
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
