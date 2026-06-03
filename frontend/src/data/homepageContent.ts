/**
 * Contenu statique de la page d'accueil (sections marketing).
 * Texte issu des maquettes — à remplacer par l'API / CMS plus tard.
 * NE PAS utiliser en production tel quel (placeholder copy).
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

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  rating: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const FEATURES: Feature[] = [
  {
    icon: 'ticket',
    title: 'Billet électronique',
    description: 'QR code unique généré et envoyé par email après réservation.',
  },
  {
    icon: 'scan',
    title: 'Scan rapide',
    description: 'Validation instantanée à l’entrée, sans file d’attente.',
  },
  {
    icon: 'award',
    title: 'Certificat automatique',
    description: 'Certificat de participation envoyé après le scan de votre billet.',
  },
];

export const THEMES: Theme[] = [
  {
    icon: 'briefcase',
    title: 'Leadership & Vision Stratégique',
    description: 'Diriger avec impact dans un environnement économique en mutation.',
  },
  {
    icon: 'trending-up',
    title: 'Finance & Investissement',
    description: 'Lever des fonds, investir et structurer une croissance durable.',
  },
  {
    icon: 'lightbulb',
    title: 'Innovation & Transformation',
    description: 'Digitaliser et réinventer les modèles d’affaires africains.',
  },
  {
    icon: 'rocket',
    title: 'Entrepreneuriat & Croissance',
    description: 'Passer de l’idée au scale, créer de la valeur localement.',
  },
];

export const INDUSTRIES: string[] = [
  'Énergie',
  'Agro-industrie',
  'Tech & Digital',
  'Mines & Ressources',
  'Banque & Finance',
  'BTP & Immobilier',
  'Santé',
  'Éducation',
];

export const CHRONO_STEPS: ChronoStep[] = [
  { phase: 'Lancement', title: 'Lancement inscriptions', date: '01 mars 2026', status: 'done' },
  { phase: 'Lancement', title: 'Offre Early Bird', date: '15 mars 2026', status: 'done' },
  { phase: 'Avant', title: 'Ouverture officielle', date: '01 mai 2026', status: 'current' },
  { phase: 'Avant', title: 'Clôture inscriptions', date: '10 juil. 2026', status: 'upcoming' },
  { phase: 'Avant', title: 'Envoi des billets', date: '12 juil. 2026', status: 'upcoming' },
  { phase: 'Pendant', title: 'Jour J — Summit', date: '15 juil. 2026', status: 'upcoming' },
  { phase: 'Post-event', title: 'Certificats envoyés', date: '17 juil. 2026', status: 'upcoming' },
  { phase: 'Post-event', title: 'Collecte des avis', date: '20 juil. 2026', status: 'upcoming' },
];

export const SPEAKERS: SpeakerCard[] = [
  { initials: 'AM', name: 'Alain Moundounga', role: 'CEO', company: 'Gabon Invest' },
  { initials: 'SC', name: 'Sophie Chambrier', role: 'Directrice', company: 'BGFI Banque' },
  { initials: 'FK', name: 'Francis Kombila', role: 'Fondateur', company: 'TechHub Libreville' },
  { initials: 'NM', name: 'Nadia Mavoungou', role: 'Présidente', company: 'Réseau Femmes Pro' },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Une édition à la hauteur de mes attentes : des intervenants de qualité et un réseau précieux.',
    name: 'Marie-Ange Obiang',
    role: 'Consultante',
    rating: 5,
  },
  {
    quote: 'Organisation impeccable, contenu dense et applicable dès le lundi suivant.',
    name: 'Jean-Baptiste Ndong',
    role: 'Entrepreneur',
    rating: 5,
  },
  {
    quote: 'Le meilleur rendez-vous business de la sous-région. Je recommande sans réserve.',
    name: 'Patrick Lebega',
    role: 'Directeur Commercial',
    rating: 5,
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Comment réserver ma place au Work Class Summit 2026 ?',
    answer:
      'Cliquez sur « Réserver », choisissez votre billet, renseignez vos informations puis validez. Vous recevez votre billet PDF par email.',
  },
  {
    question: 'Quels sont les types de billets disponibles et leurs avantages ?',
    answer:
      'Plusieurs pass sont proposés (Standard, Premium, VIP) avec des accès et options différents (ateliers, repas, networking).',
  },
  {
    question: 'Comment cela se passe pour mon billet électronique ?',
    answer: 'Votre billet contient un QR code unique. Présentez-le à l’entrée pour le scan.',
  },
  {
    question: 'Puis-je annuler ou modifier ma réservation ?',
    answer: 'Oui, contactez le support avant la date de clôture des inscriptions.',
  },
  {
    question: 'Comment se passe le contrôle d’accès le jour J ?',
    answer: 'Un scan du QR code de votre billet suffit. Pensez à l’avoir sur votre téléphone.',
  },
  {
    question: 'Quels modes de paiement sont acceptés ?',
    answer: 'Paiement en ligne (simulation en v1). Les paiements réels seront ajoutés prochainement.',
  },
  {
    question: 'Vais-je recevoir un certificat de participation ?',
    answer: 'Oui, un certificat est généré et envoyé automatiquement après le scan de votre billet.',
  },
  {
    question: 'Comment devenir partenaire ou sponsor ?',
    answer: 'Écrivez-nous via la page contact, notre équipe partenariats vous répondra rapidement.',
  },
];
