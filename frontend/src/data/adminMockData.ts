/**
 * Données de test pour les écrans admin (dev local UI uniquement).
 * Modèles dénormalisés « view-model » — proches de ce que renverra l'API.
 * NE PAS utiliser en production.
 */

export interface AdminBookingRow {
  reference: string;
  participant: string;
  email: string;
  ticket: 'Standard' | 'VIP Premium';
  amount: number;
  paymentStatus: 'paid' | 'pending' | 'failed';
  status: 'confirmed' | 'pending' | 'cancelled';
  date: string;
}

export interface AdminParticipantRow {
  name: string;
  email: string;
  company: string;
  ticket: 'Standard' | 'VIP Premium';
  expectationsSubmitted: boolean;
  status: 'confirmed' | 'pending';
}

export interface AdminReviewRow {
  participant: string;
  rating: number;
  comment: string;
  date: string;
}

export interface AdminCertificateRow {
  participant: string;
  ticket: 'Standard' | 'VIP Premium';
  presenceConfirmed: boolean;
  generated: boolean;
  sent: boolean;
}

export interface AdminAd {
  id: string;
  title: string;
  active: boolean;
}

export interface AdminScanEntry {
  participant: string;
  reference: string;
  ticket?: 'Standard' | 'VIP Premium';
  time: string;
  status: 'valid' | 'invalid';
  reason?: string;
}

export const ADMIN_BOOKINGS: AdminBookingRow[] = [
  {
    reference: 'WCG-RES-A1B2C3',
    participant: 'Marie-Ange Obiang',
    email: 'ma.obiang@stratego.ga',
    ticket: 'VIP Premium',
    amount: 75000,
    paymentStatus: 'paid',
    status: 'confirmed',
    date: '05/05/2026',
  },
  {
    reference: 'WCG-RES-D4E5F6',
    participant: 'Jean-Baptiste Ndong',
    email: 'jb.ndong@gmail.com',
    ticket: 'Standard',
    amount: 35000,
    paymentStatus: 'paid',
    status: 'confirmed',
    date: '04/05/2026',
  },
  {
    reference: 'WCG-RES-G7H8J9',
    participant: 'Patrick Lekogo',
    email: 'p.lekogo@bgfi.ga',
    ticket: 'VIP Premium',
    amount: 75000,
    paymentStatus: 'pending',
    status: 'pending',
    date: '03/05/2026',
  },
  {
    reference: 'WCG-RES-K1L2M3',
    participant: 'Sandrine Ella',
    email: 's.ella@seeg.ga',
    ticket: 'Standard',
    amount: 35000,
    paymentStatus: 'paid',
    status: 'confirmed',
    date: '02/05/2026',
  },
];

export const ADMIN_PARTICIPANTS: AdminParticipantRow[] = [
  {
    name: 'Marie-Ange Obiang',
    email: 'ma.obiang@stratego.ga',
    company: 'Cabinet Stratégo',
    ticket: 'VIP Premium',
    expectationsSubmitted: true,
    status: 'confirmed',
  },
  {
    name: 'Jean-Baptiste Ndong',
    email: 'jb.ndong@gmail.com',
    company: 'Indépendant',
    ticket: 'Standard',
    expectationsSubmitted: false,
    status: 'confirmed',
  },
  {
    name: 'Patrick Lekogo',
    email: 'p.lekogo@bgfi.ga',
    company: 'BGFI Bank',
    ticket: 'VIP Premium',
    expectationsSubmitted: true,
    status: 'pending',
  },
  {
    name: 'Sandrine Ella',
    email: 's.ella@seeg.ga',
    company: 'SEEG',
    ticket: 'Standard',
    expectationsSubmitted: true,
    status: 'confirmed',
  },
];

export const ADMIN_REVIEWS: AdminReviewRow[] = [
  {
    participant: 'Marie-Ange Obiang',
    rating: 5,
    comment: 'Organisation parfaite. Meilleure édition à ce jour.',
    date: '17/07/2025',
  },
  {
    participant: 'Jean-Baptiste Ndong',
    rating: 5,
    comment: 'Billetterie fluide, intervenants excellents.',
    date: '17/07/2025',
  },
  {
    participant: 'Patrick Lekogo',
    rating: 5,
    comment: 'Événement corporate de référence au Gabon.',
    date: '18/07/2025',
  },
];

export const ADMIN_CERTIFICATES: AdminCertificateRow[] = [
  {
    participant: 'Marie-Ange Obiang',
    ticket: 'VIP Premium',
    presenceConfirmed: false,
    generated: false,
    sent: false,
  },
  {
    participant: 'Jean-Baptiste Ndong',
    ticket: 'Standard',
    presenceConfirmed: false,
    generated: false,
    sent: false,
  },
];

export const ADMIN_ADS: AdminAd[] = [
  { id: 'ad-1', title: 'Partenaire Or — BGFI Bank', active: true },
  { id: 'ad-2', title: 'Networking Cocktail VIP', active: true },
  { id: 'ad-3', title: 'Early Bird — dernières places', active: true },
];

export const ADMIN_SCAN_RECENT: AdminScanEntry[] = [
  {
    participant: 'Marie-Ange Obiang',
    reference: 'WCG-2026-00141',
    ticket: 'VIP Premium',
    time: '09:14',
    status: 'valid',
  },
  {
    participant: 'Jean-Baptiste Ndong',
    reference: 'WCG-2026-00147',
    ticket: 'Standard',
    time: '09:11',
    status: 'valid',
  },
  {
    participant: 'Inconnu',
    reference: '—',
    time: '09:08',
    status: 'invalid',
    reason: 'Billet invalide ou déjà utilisé',
  },
];

export interface AdminSettings {
  emailFrom: string;
  emailFromName: string;
  smtpHost: string;
  smtpPort: number;
  priceStandard: number;
  priceVip: number;
  capacityMax: number;
  earlyBirdSeats: number;
  ticketPrefix: string;
  ticketFooter: string;
  autoQr: boolean;
  autoCertificate: boolean;
  sessionDurationMin: number;
  maxLoginAttempts: number;
  twoFactor: boolean;
  loginJournal: boolean;
}

export const ADMIN_SETTINGS: AdminSettings = {
  emailFrom: 'noreply@workclassgabon.ga',
  emailFromName: 'Work Class Gabon',
  smtpHost: 'smtp.workclassgabon.ga',
  smtpPort: 587,
  priceStandard: 35000,
  priceVip: 75000,
  capacityMax: 500,
  earlyBirdSeats: 200,
  ticketPrefix: 'WCG-2026-',
  ticketFooter: 'Work Class Gabon · Libreville 2026',
  autoQr: true,
  autoCertificate: true,
  sessionDurationMin: 120,
  maxLoginAttempts: 5,
  twoFactor: false,
  loginJournal: true,
};

export type ActivityColor = 'navy' | 'success' | 'purple' | 'warning';

export interface AdminActivityItem {
  id: string;
  initial: string;
  color: ActivityColor;
  title: string;
  detail: string;
  ago: string;
}

export const ADMIN_ACTIVITY: AdminActivityItem[] = [
  {
    id: 'act-1',
    initial: 'N',
    color: 'navy',
    title: 'Nouvelle réservation',
    detail: 'VIP Premium · Georges Ela',
    ago: 'il y a 5 min',
  },
  {
    id: 'act-2',
    initial: 'P',
    color: 'success',
    title: 'Paiement validé',
    detail: '35 000 FCFA · J.-B. Ndong',
    ago: 'il y a 8 min',
  },
  {
    id: 'act-3',
    initial: 'A',
    color: 'purple',
    title: 'Attentes soumises',
    detail: 'Marie-Ange Obiang',
    ago: 'il y a 9 min',
  },
  {
    id: 'act-4',
    initial: 'P',
    color: 'warning',
    title: 'Paiement en attente',
    detail: '75 000 FCFA · P. Lekogo',
    ago: 'il y a 42 min',
  },
  {
    id: 'act-5',
    initial: 'N',
    color: 'navy',
    title: 'Nouvelle réservation',
    detail: 'Standard · Carole Dekale',
    ago: 'il y a 1 h',
  },
];

export const ADMIN_DASHBOARD = {
  totalBookings: 127,
  bookingsDelta: '+14 cette semaine',
  revenue: '1.3M',
  revenueDelta: '+1,2M ce mois',
  seatsRemaining: 373,
  seatsTotal: 500,
  avgRating: 5,
  reviewsCount: 184,
  ticketSplit: { standard: 167, vip: 60, available: 273, total: 227 },
} as const;
