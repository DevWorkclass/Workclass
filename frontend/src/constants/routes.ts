/**
 * Routes applicatives — source de vérité unique pour la navigation.
 * Tout lien dans l'app DOIT pointer vers une constante ici.
 */

export const ROUTES = {
  public: {
    home: '/',
    events: '/evenements',
    eventDetail: (slug: string) => `/evenements/${slug}`,
    reservation: {
      base: '/reservation',
      etape1: '/reservation/etape-1',
      etape2: '/reservation/etape-2',
      etape3: '/reservation/etape-3',
      etape4: '/reservation/etape-4',
      etape5: '/reservation/etape-5',
      confirmation: '/reservation/confirmation',
    },
    participant: {
      base: '/participant',
      ticket: '/participant/ticket',
    },
  },
  admin: {
    login: '/admin/login',
    dashboard: '/admin/dashboard',
    events: '/admin/evenements',
    bookings: '/admin/reservations',
    participants: '/admin/participants',
    scan: '/admin/scan',
    certificates: '/admin/certificats',
    feedback: '/admin/avis',
    ads: '/admin/publicites',
    users: '/admin/utilisateurs',
    settings: '/admin/parametres',
    profile: '/admin/profil',
  },
} as const;
