import { z } from 'zod';

const themeIcon = z.enum(['briefcase', 'trending-up', 'lightbulb', 'rocket', 'globe']);

export const homeThemeSchema = z.object({
  icon: themeIcon,
  title: z.string().min(2, 'Titre requis').max(160),
  description: z.string().min(2, 'Description requise').max(400),
  imageUrl: z.string().url('URL image invalide').optional().or(z.literal('')),
  content: z.string().max(2000, 'Contenu trop long').optional().or(z.literal('')),
});

export const setHomeThemesSchema = z.object({
  themes: z.array(homeThemeSchema).min(1, 'Au moins un domaine').max(12),
});

export type SetHomeThemesInput = z.infer<typeof setHomeThemesSchema>;

export const partnerSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(120),
  logoUrl: z.string().url('URL logo invalide').optional().or(z.literal('')),
  description: z.string().max(300).optional().or(z.literal('')),
});

export const setPartnersSchema = z.object({
  partners: z.array(partnerSchema).max(30),
});

export const setAppConfigSchema = z.object({
  testimonialIntervalMs: z.number().int().min(1000).max(60000),
  testimonialAutoScroll: z.boolean(),
});

// --- Industries (tuiles « Au service de toutes les industries ») ---
export const industrySchema = z.object({
  name: z.string().min(1, 'Nom requis').max(80),
  imageUrl: z.string().url('URL image invalide').optional().or(z.literal('')),
});

export const setIndustriesSchema = z.object({
  industries: z.array(industrySchema).max(16),
});

// --- Footer ---
// href sécurisé : http(s)/mailto/tel ou chemin relatif (#, /). Bloque javascript:/data: (anti-XSS).
const safeHref = z
  .string()
  .max(300)
  .refine(
    (h) => /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(h.trim()),
    'Lien non autorisé',
  );

export const footerLinkSchema = z.object({
  label: z.string().min(1, 'Libellé requis').max(80),
  href: safeHref,
});

// Numéro de téléphone permissif (chiffres, +, espaces, tirets, parenthèses), vide autorisé.
const phoneField = z
  .string()
  .max(30)
  .regex(/^[+0-9 ()\-]*$/, 'Numéro invalide');

export const setPaymentConfigSchema = z.object({
  airtelMoney: phoneField,
  mobileCash: phoneField,
  instructions: z.string().max(500),
});

export const setSupportConfigSchema = z.object({
  whatsapp: phoneField,
  email: z.string().email('Email invalide').or(z.literal('')),
});

export const setFooterSchema = z.object({
  description: z.string().max(400),
  contactEmail: z.string().email('Email invalide').or(z.literal('')),
  location: z.string().max(120),
  columns: z
    .array(
      z.object({
        title: z.string().min(1, 'Titre requis').max(60),
        links: z.array(footerLinkSchema).max(8),
      }),
    )
    .max(4),
});

// --- Publicités / annonces (carrousel d'accueil) ---
export const adSlideSchema = z.object({
  tag: z.string().max(60).optional().or(z.literal('')),
  title: z.string().min(1, 'Titre requis').max(160),
  body: z.string().max(300).optional().or(z.literal('')),
  cta: z.string().max(40).optional().or(z.literal('')),
  href: safeHref.optional().or(z.literal('')),
  imageUrl: z.string().url('URL image invalide').optional().or(z.literal('')),
  active: z.boolean(),
});

export const setAdsSchema = z.object({
  ads: z.array(adSlideSchema).max(20),
});

// --- Porteurs du projet ---
export const promoterSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(120),
  role: z.string().max(120).optional().or(z.literal('')),
  photoUrl: z.string().url('URL photo invalide').optional().or(z.literal('')),
});

export const setPromotersSchema = z.object({
  promoters: z.array(promoterSchema).max(30),
});

// --- Événement à la une ---
export const setFeaturedEventSchema = z.object({
  eventId: z.string().uuid('ID evenement invalide').nullable(),
});

// --- Fenêtre « En découvrir plus » ---
export const setAboutSchema = z.object({
  title: z.string().min(2, 'Titre requis').max(160),
  content: z.string().min(2, 'Contenu requis').max(4000),
});
