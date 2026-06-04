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
  icon: 'briefcase' | 'trending-up' | 'lightbulb' | 'rocket';
  title: string;
  description: string;
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
