/**
 * Endpoints API exposés par le backend Express (`backend/`, port 3001).
 * Préfixés par `NEXT_PUBLIC_API_URL` côté fetch (cf. `frontend/.env.local`).
 *
 * RÈGLES DE SÉCURITÉ STRICTES :
 *  1. TOUTE la logique métier vit côté backend Express. Le frontend
 *     ne fait QUE des appels API typés — aucun calcul métier ici.
 *  2. TOUTE requête avec données sensibles (référence, token, id, email…)
 *     est en POST avec body JSON. Les GET sont réservés aux endpoints
 *     publics non sensibles (ex: /health, listes filtrées sans secret).
 *
 * Toutes les URLs ci-dessous sont des chemins constants — pas de fonctions
 * générant des URLs avec des paramètres sensibles dans le path.
 */

export const API_ENDPOINTS = {
  booking: {
    create: '/api/booking/create',           // POST  body: BookingInput
    lookup: '/api/booking/lookup',           // POST  body: { reference }
  },
  admin: {
    bookingsSearch: '/api/admin/bookings/search',     // POST  body: filters
    bookingGet: '/api/admin/bookings/get',            // POST  body: { id }
    bookingValidate: '/api/admin/bookings/validate',  // POST  body: { id }
    bookingCancel: '/api/admin/bookings/cancel',      // POST  body: { id, reason? }
    bookingsExport: '/api/admin/bookings/export',     // POST  body: { format, status?, eventId? }
    participantsExport: '/api/admin/participants/export', // POST  body: { format, eventId? }
  },
  tickets: {
    generate: '/api/tickets/generate',  // POST  body: { bookingId }
    get: '/api/tickets/get',            // POST  body: { ticketId }
  },
  scan: {
    verify: '/api/scan/verify',    // POST  body: { qrPayload }
    confirm: '/api/scan/confirm',  // POST  body: { ticketId, scannerId? }
  },
  notifications: {
    send: '/api/notifications/send',  // POST (interne)
  },
  feedback: {
    generateLink: '/api/feedback/generate-link',  // POST  body: { bookingId }
    validate: '/api/feedback/validate',           // POST  body: { token }
    submit: '/api/feedback/submit',               // POST  body: { token, ratings, comment? }
    moderate: '/api/admin/feedback/moderate',     // POST  body: { responseId, action }
  },
  payments: {
    initiate: '/api/payments/initiate',  // POST  body: { bookingId, provider }
    webhook: '/api/webhooks/payment',    // POST (signé par le provider)
  },
  content: {
    homeThemes: '/api/content/home-themes',            // GET (public, non sensible)
    setHomeThemes: '/api/admin/content/home-themes',   // POST body: { themes }
    uploadImage: '/api/admin/content/upload-image',    // POST multipart (champ « image »)
  },
  metrics: {
    visit: '/api/metrics/visit',         // POST (public, compteur visites)
    kpi: '/api/admin/metrics/kpi',       // GET (admin, agrégat KPI)
  },
  health: '/api/health',  // GET (non sensible)
} as const;
