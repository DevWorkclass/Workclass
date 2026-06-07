import { z } from 'zod';

const themeIcon = z.enum(['briefcase', 'trending-up', 'lightbulb', 'rocket', 'globe']);

export const homeThemeSchema = z.object({
  icon: themeIcon,
  title: z.string().min(2, 'Titre requis').max(160),
  description: z.string().min(2, 'Description requise').max(400),
  imageUrl: z.string().url('URL image invalide').optional().or(z.literal('')),
});

export const setHomeThemesSchema = z.object({
  themes: z.array(homeThemeSchema).min(1, 'Au moins un domaine').max(12),
});

export type SetHomeThemesInput = z.infer<typeof setHomeThemesSchema>;
