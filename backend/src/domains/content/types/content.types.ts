/**
 * Types du domaine content (contenu éditable du site public).
 */

export type ThemeIcon = 'briefcase' | 'trending-up' | 'lightbulb' | 'rocket' | 'globe';

/** Un domaine/thème de la page d'accueil, illustrable par une image. */
export interface HomeTheme {
  icon: ThemeIcon;
  title: string;
  description: string;
  /** URL publique de l'image d'illustration (optionnelle → fallback dégradé). */
  imageUrl?: string;
  /** Contenu détaillé du module (révélé via « Voir plus »). */
  content?: string;
}

/** Clés de stockage dans `site_settings`. */
export const HOME_THEMES_KEY = 'home_themes';
export const PARTNERS_KEY = 'partners';
export const APP_CONFIG_KEY = 'app_config';
export const INDUSTRIES_KEY = 'industries';
export const FOOTER_KEY = 'footer';
export const PAYMENT_CONFIG_KEY = 'payment_config';
export const SUPPORT_CONFIG_KEY = 'support_config';

/** Logo partenaire (affiché sur la page d'accueil). */
export interface Partner {
  name: string;
  logoUrl?: string;
  description?: string;
}

/** Industrie/domaine couvert (tuile illustrée de l'accueil). */
export interface Industry {
  name: string;
  imageUrl?: string;
}

/** Lien de footer. */
export interface FooterLink {
  label: string;
  href: string;
}

/** Contenu éditable du footer. */
export interface FooterContent {
  description: string;
  contactEmail: string;
  location: string;
  columns: { title: string; links: FooterLink[] }[];
}

/** Numéros mobile money de réception (affichés au paiement). */
export interface PaymentConfig {
  airtelMoney: string;
  mobileCash: string;
  instructions: string;
}

/** Contact support client (WhatsApp + email uniquement, pas d'appel). */
export interface SupportConfig {
  whatsapp: string;
  email: string;
}

/** Configuration du dynamisme de l'app (page d'accueil). */
export interface AppConfig {
  /** Intervalle de défilement automatique des témoignages (ms). */
  testimonialIntervalMs: number;
  /** Active le défilement automatique des avis. */
  testimonialAutoScroll: boolean;
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  testimonialIntervalMs: 4000,
  testimonialAutoScroll: true,
};

/**
 * Valeurs par défaut (miroir de `frontend/src/data/homepageContent.ts`).
 * Servies tant qu'aucune personnalisation n'a été enregistrée.
 */
export const DEFAULT_HOME_THEMES: HomeTheme[] = [
  {
    icon: 'briefcase',
    title: "01 · L'agripreneur et sa structure",
    description: 'Structuration juridique, business plan, coopérative et financement ANPI.',
  },
  {
    icon: 'lightbulb',
    title: '02 · La réglementation selon les destinations',
    description: "ZLECAf · UE (RDUE / MACF) · Asie (GACC) : maîtriser les règles d'accès aux marchés.",
  },
  {
    icon: 'rocket',
    title: '03 · Transport, emballage & Incoterms',
    description:
      "Choix de l'Incoterm, emballage export, transitaire agréé et schéma logistique gabonais.",
  },
  {
    icon: 'globe',
    title: '04 · Opportunités & Marchés',
    description:
      'ZLECAf, accords CEMAC-UE et stratégies de positionnement sur les marchés africains et internationaux.',
  },
];

/** Industries par défaut (miroir de `frontend/src/data/homepageContent.ts`). */
export const DEFAULT_INDUSTRIES: Industry[] = [
  { name: 'Agripreneurs' },
  { name: 'Coopératives' },
  { name: 'Exportateurs' },
  { name: 'Opérateurs agricoles' },
  { name: 'Transformation locale' },
  { name: 'Logistique & transit' },
  { name: 'Douane & conformité' },
  { name: 'PMI agro' },
];

/** Footer par défaut (miroir de `Footer.tsx`, sans le chronogramme). */
export const DEFAULT_FOOTER: FooterContent = {
  description:
    "Plateforme de réservation et de gestion d'événements professionnels au Gabon.",
  contactEmail: 'support@workclass.com',
  location: 'Libreville, Gabon',
  columns: [
    {
      title: 'Événement',
      links: [
        { label: "L'Événement", href: '/#evenement' },
        { label: 'Événements', href: '/evenements' },
      ],
    },
    {
      title: 'Réservation',
      links: [
        { label: 'Réserver', href: '/reservation' },
        { label: 'Mon billet', href: '/participant' },
        { label: 'FAQ', href: '/#faq' },
      ],
    },
    {
      title: 'Contact',
      links: [
        { label: 'support@workclass.com', href: 'mailto:support@workclass.com' },
        { label: 'Devenir partenaire', href: '#' },
      ],
    },
  ],
};

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  airtelMoney: '',
  mobileCash: '',
  instructions:
    'Effectuez le paiement vers le numéro indiqué, puis conservez votre référence de réservation.',
};

export const DEFAULT_SUPPORT_CONFIG: SupportConfig = {
  whatsapp: '',
  email: 'support@workclass.com',
};
