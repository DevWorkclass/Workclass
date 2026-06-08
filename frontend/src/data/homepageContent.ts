/**
 * Contenu de la page d'accueil — Workclass Commerce International Gabon 2026.
 * Source : OnePager LOGWILA + dossier de contenu (mai 2026).
 * Marque : WORKCLASS · Valorisation des opérations logistiques · GABON 2026.
 */

export interface Feature {
  icon: 'ticket' | 'scan' | 'award';
  title: string;
  description: string;
}

export interface Theme {
  icon: 'briefcase' | 'trending-up' | 'lightbulb' | 'rocket' | 'globe';
  title: string;
  description: string;
  /** Image d'illustration éditable depuis l'admin (sinon dégradé + icône). */
  imageUrl?: string;
  /** Contenu détaillé du module (révélé via « Voir plus »). */
  content?: string;
}

export interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}

export interface ChronoStep {
  phase: 'Lancement' | 'Avant' | 'Pendant' | 'Post-event';
  title: string;
  date: string;
  status: 'done' | 'current' | 'upcoming';
}

export interface SpeakerCard {
  initials: string;
  name: string;
  role: string;
  company: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface AdSlide {
  id: string;
  tag: string;
  title: string;
  body: string;
  cta?: string;
  href?: string;
  /** URL de l'image de couverture (remplace le placeholder coloré quand fournie). */
  imageUrl?: string;
  visual: {
    fromColor: string;
    toColor: string;
    initial: string;
    textColor: string;
  };
}

/** Slides publicitaires / partenaires (carousel homepage). */
export const AD_SLIDES: AdSlide[] = [
  {
    id: 'wila',
    tag: 'Partenaire Officiel',
    title: 'Avec le soutien de WILA',
    body: 'Women In Logistics Africa Gabon · « Together we are stronger »',
    cta: 'Découvrir',
    href: '#',
    visual: { fromColor: '#0D2145', toColor: '#1d4ed8', initial: 'WILA', textColor: '#C8A84B' },
  },
  {
    id: 'book',
    tag: 'Publication partenaire',
    title: 'Venez découvrir le nouvel ouvrage',
    body: "d'Amandine NTSAME · Disponible en librairie",
    cta: 'En savoir plus',
    href: '#',
    visual: { fromColor: '#7c2d12', toColor: '#c2410c', initial: 'AN', textColor: '#FED7AA' },
  },
  {
    id: 'ccaim',
    tag: 'Lieu officiel',
    title: 'CCAIM · Chambre de Commerce',
    body: 'Agriculture, Industrie, Mines et Artisanat de Libreville',
    cta: 'Visiter',
    href: '#',
    visual: { fromColor: '#064e3b', toColor: '#059669', initial: 'CCM', textColor: '#6ee7b7' },
  },
  {
    id: 'vip',
    tag: 'Offre limitée',
    title: 'Places VIP Premium — encore disponibles',
    body: '75 000 FCFA · Cocktail exclusif · Certificat premium encadré',
    cta: 'Réserver',
    href: '/reservation',
    visual: { fromColor: '#78350f', toColor: '#d97706', initial: 'VIP', textColor: '#fef3c7' },
  },
];

/** Piliers de la marque (chips drapeau Gabon). */
export const BRAND_PILLARS = ['Ancrage Gabon', 'Supply chain', 'Ouverture internationale'] as const;

/** Chiffres-clés du contexte (justification de la workclass). */
export const KEY_STATS: { value: string; label: string }[] = [
  { value: '60–70 %', label: 'des besoins alimentaires importés' },
  { value: '450 Mds', label: 'FCFA/an de dépendance en devises' },
  { value: '54', label: 'marchés africains ouverts par la ZLECAf' },
  { value: '3', label: 'modules pratiques · 4h de formation' },
];

export const FEATURES: Feature[] = [
  {
    icon: 'ticket',
    title: 'Billet électronique',
    description: 'QR code unique généré et envoyé par email après votre inscription.',
  },
  {
    icon: 'scan',
    title: 'Accès contrôlé',
    description: "Validation instantanée du billet à l'entrée de la CCAIM, sans file d'attente.",
  },
  {
    icon: 'award',
    title: 'Livret & Livre Blanc',
    description: 'Livret ressources et accès au Livre Blanc SCI remis à chaque participant.',
  },
];

/** Les 3 modules de la workclass. */
export const THEMES: Theme[] = [
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

/** Publics et filières concernés. */
export const INDUSTRIES: string[] = [
  'Agripreneurs',
  'Coopératives',
  'Exportateurs',
  'Opérateurs agricoles',
  'Transformation locale',
  'Logistique & transit',
  'Douane & conformité',
  'PMI agro',
];

/** Partenaires institutionnels. */
export const PARTNERS: { name: string; description: string }[] = [
  { name: 'CCAIM', description: 'Chambre de Commerce, Agriculture, Industrie, Mines & Artisanat' },
  { name: 'AGASA', description: 'Agence Gabonaise de Sécurité Alimentaire' },
  { name: 'CGC', description: 'Conseil Gabonais des Chargeurs' },
  { name: 'ANPI', description: 'Agence Nationale des Promotions et des Investissements' },
  { name: 'ZLECAf', description: 'Zone de Libre-Échange Continentale Africaine · Agenda 2063' },
];

export const CHRONO_STEPS: ChronoStep[] = [
  { phase: 'Lancement', title: 'Ouverture des inscriptions', date: '15 mai 2026', status: 'done' },
  { phase: 'Avant', title: 'Confirmation des places', date: '20 juin 2026', status: 'current' },
  { phase: 'Avant', title: 'Convocation CCAIM & billets', date: '30 juin 2026', status: 'upcoming' },
  { phase: 'Pendant', title: 'Workclass — 08h45 à 12h45', date: '04 juil. 2026', status: 'upcoming' },
  {
    phase: 'Post-event',
    title: 'Remise livret & Livre Blanc SCI',
    date: '04 juil. 2026',
    status: 'upcoming',
  },
  {
    phase: 'Post-event',
    title: 'Rapport post-événement',
    date: '11 juil. 2026',
    status: 'upcoming',
  },
];

/** Porteurs du projet et co-animation. */
export const SPEAKERS: SpeakerCard[] = [
  {
    initials: 'VB',
    name: 'Valérie Benquet',
    role: 'Co-organisatrice · Ingénierie douanière',
    company: 'EC DOUANE & IDELO',
  },
  {
    initials: 'PW',
    name: 'Pauline White',
    role: 'Co-organisatrice · Logistique multimodale',
    company: '2NY Consulting',
  },
  {
    initials: 'DC',
    name: 'Experts Douane & Commerce',
    role: 'Co-animation · OEA, CEMAC, OMD',
    company: 'DGDDI',
  },
  {
    initials: 'CG',
    name: 'Conseil Gabonais des Chargeurs',
    role: 'Apport · Fret & corridors logistiques',
    company: 'CGC',
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Marie-Ange Obiang',
    role: 'Directrice · Cabinet Stratégo',
    content:
      'Organisation parfaite. Meilleure édition à ce jour. Des intervenants de très haut niveau qui ont su transformer la complexité douanière en opportunité concrète.',
    rating: 5,
  },
  {
    name: 'Jean-Baptiste Ndong',
    role: 'Entrepreneur · Libreville',
    content:
      "Billetterie fluide, intervenants excellents. Je suis reparti avec un plan d'action export concret. Un réseau de qualité et des insights vraiment actionnables.",
    rating: 5,
  },
  {
    name: 'Patrick Lekogo',
    role: 'Directeur Commercial · BGFI Bank',
    content:
      "Événement corporate de référence au Gabon. L'approche pratique des modules m'a permis de comprendre les véritables enjeux financiers de l'export agricole.",
    rating: 5,
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Quand et où se tient la workclass ?',
    answer: 'Le 04 juillet 2026, de 08h45 à 12h45, à la CCAIM de Libreville.',
  },
  {
    question: "À qui s'adresse cette workclass ?",
    answer:
      "Aux agripreneurs, exportateurs, coopératives et opérateurs agricoles souhaitant maîtriser la chaîne d'exportation.",
  },
  {
    question: 'Quels sont les 3 modules au programme ?',
    answer:
      "01 L'agripreneur et sa structure · 02 La réglementation selon les destinations (ZLECAf, UE, Asie) · 03 Transport, emballage & Incoterms.",
  },
  {
    question: 'Que vais-je repartir avec ?',
    answer:
      "Un plan d'action export concret pour votre produit, un livret ressources et l'accès au Livre Blanc SCI.",
  },
  {
    question: 'Comment réserver ma place ?',
    answer:
      'Cliquez sur « Réserver », choisissez votre billet, renseignez vos informations puis validez. Votre billet QR vous est envoyé par email.',
  },
  {
    question: 'Qui porte le projet ?',
    answer:
      '2NY Consulting et EC DOUANE & IDELO, avec le soutien de Women In Logistics Africa Gabon (WILA).',
  },
  {
    question: 'Quels partenaires institutionnels accompagnent la workclass ?',
    answer: 'CCAIM, AGASA, CGC et ANPI, dans le cadre de la ZLECAf et de l’Agenda 2063.',
  },
  {
    question: "Comment contacter l'organisation ?",
    answer: 'Par email à wilagabon@gmail.com.',
  },
];
