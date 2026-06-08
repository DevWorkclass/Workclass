# État du projet — WORK CLASS Gabon

Récapitulatif complet des fonctionnalités livrées (base pour documentation + guide).
Monorepo : **frontend** Next 15/React 19/Tailwind (Vercel) · **backend** Express/Prisma/Postgres (Render) · Supabase (DB + Storage) · Upstash (Redis) · Resend (mails). Branche unique `main`, déploiement auto.

---

## 1. Architecture & conventions

- **Logique métier 100 % backend** ; le frontend ne fait que des appels API typés.
- **POST + body JSON** pour toute donnée sensible (référence, token, id interne, email, filtre nominatif). GET réservé au non sensible (`/api/health`, listes publiées).
- TypeScript strict (pas de `any`), commentaires/UI en français.
- RBAC backend : `requirePermission` relu en base à chaque requête ; garde UI en complément (`hasPermission`).
- Front : `apiFetch`/`apiAuth`/`apiUpload`/`apiDownload` (`frontend/src/lib/api.ts`) — chemins **sans** préfixe `/api` (déjà dans `apiUrl`).
- Vérif avant push : `cd frontend && npx tsc --noEmit && npm run lint` ; `cd backend && npx tsc --noEmit`.
- Commits : Conventional Commits, FR, **sans** `Co-Authored-By`.

---

## 2. Modèle de données (Prisma — ajouts récents)

- `Booking.quantity Int @default(1)` — places multiples par réservation.
- `Event.recommendations String?` — recommandations propres à l'événement.
- `TicketType` — tarif + `quota` + `soldCount` (décompte des places).
- `SiteSetting { key @id, value Json, updatedAt }` — contenu éditable :
  - `home_themes` (domaines + images), `partners` (logos), `app_config` (dynamisme).
- Migrations appliquées via `prisma db push` (additif, pas de dossier `migrations/`).

---

## 3. Permissions (catalogue)

`bookings:read`, `bookings:write`, `tickets:generate`, `scan`, `feedback:read`,
`feedback:moderate`, `payments:manage`, `users:manage`, `content:manage`.
`super_admin` = toutes implicitement. Miroir front : `frontend/src/constants/permissions.ts`.

---

## 4. Fonctionnalités livrées

### 4.1 Réservations & quantité de places
- `Booking.quantity` : total = prix × quantité ; quota réservé/libéré par N places (atomique `sold + N <= quota`).
- **Participants présents** = Σ `quantity` des réservations dont le billet est scanné.

### 4.2 Exports (CSV + PDF)
- `POST /admin/bookings/export` et `POST /admin/participants/export` (body `{ format, status?, eventId? }`).
- CSV maison (BOM UTF-8, `;`, **anti-injection de formules**) + PDF table paginée (`generateListPDF`).
- Front : `ExportButtons` + helper `apiDownload`. Filtre par événement propagé.

### 4.3 KPI / Dashboard
- `GET /admin/metrics/kpi` : totaux (réservations, revenus, présents, visites, note) + **3 KPI TDR** :
  - **Conversion** = réservations / visites
  - **Remplissage** = places vendues / quota
  - **Engagement** = avis / réservations
- Compteur de **visites** : `POST /metrics/visit` (Redis, sans PII), pingé par `VisitTracker` au chargement public.
- Dashboard premium : KPI + jauges TDR + **actions rapides**. Répartitions détaillées (par événement / type / budget) déplacées dans **Paramètres → Statistiques détaillées**.

### 4.4 Événements
- Création/édition complète (`EventForm`) : titre, description, lieu, dates, **statut**,
  **programme** (créneaux), **intervenants** (nom + rôle), **types de billets** (prix + places),
  **couverture** (URL **ou** upload Supabase + aperçu), recommandations.
- `GET /events` (admin) expose `seatsTotal/seatsSold/seatsAvailable`.
- `POST /admin/events/update` + `/admin/events/delete` (id en body ; suppression refusée si réservations).
- **Vue publique** : `GET /public/events` (publiés). Pages :
  - `/evenements` (liste de tous les publiés)
  - `/evenements/[slug]` (détail : programme, intervenants+rôle, recommandations, billets, **bouton Réserver** sticky)
- **Accueil dynamique** : hero branché sur le **dernier événement publié** (repli statique), section **3 événements récents**.

### 4.5 Avis / Témoignages
- Lien privé par participant : `POST /feedback/validate`, `POST /feedback/submit` (public).
- Page publique `/avis/[token]` (notation par critères + commentaire).
- Admin : `GET /admin/feedback` + modération approuver/rejeter.
- **Témoignages accueil** : `GET /content/testimonials` (avis approuvés, anonymisés) en carrousel auto (intervalle configurable, défaut 4 s) + manuel.

### 4.6 Certificats / Scan
- `GET /admin/tickets` (liste + état certificat/présence). Page Certificats (lecture seule + liens).
- Scan : `POST /scan/verify` + `/scan/confirm` (HMAC vérifié backend ; saisie manuelle du QR JSON faute de lib caméra). Certificat généré + envoyé à la confirmation.

### 4.7 Contenu dynamique (admin → accueil)
- **Domaines** (`home_themes`) : images éditables (Paramètres) → `ThemesSection`.
- **Partenaires** (`partners`) : logos gérés (Paramètres → Config) → `PartnersSection` (défilement continu).
- **Config dynamisme** (`app_config`) : intervalle/activation du carrousel d'avis.
- Endpoints : `GET /content/{home-themes,partners,app-config,testimonials}` (public) ;
  `POST /admin/content/{home-themes,partners,app-config,upload-image}`.

### 4.8 Branding / PWA
- Logo officiel `logo-icone.png` : favicon (`app/icon.png`), icône PWA installable (manifest 192/512, `apple-icon.png`), affiché partout via `Logo`.

### 4.9 Cron
- `registerJobs` (backend) : toutes les 15 min, `sendFeedbackLinksForEndingEvents` envoie les liens d'avis aux **billets scannés** des événements finissant dans l'heure (idempotent).

### 4.10 Navigation / UI
- **Navbar publique fixe** (ne défile plus), responsive md/lg, lien Intervenants retiré, lien **Événements** ajouté, bouton Réserver toujours visible.
- Sidebar admin : drawer rétractable mobile, lien Certificats présent.
- Tables admin responsives (min-width, colonnes masquées, troncature).

---

## 5. Variables d'environnement notables (backend)

- `DATABASE_URL`, `DIRECT_URL` (Supabase pooler)
- `REDIS_URL` (Upstash) — requis : `server.ts` attend `redis.ping()` avant `listen`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` (privé), **`SUPABASE_PUBLIC_BUCKET`** (public — images domaines/partenaires/couvertures)
- `CORS_ORIGIN`/`FRONTEND_URL`, `RATE_LIMIT_*`, `DOCS_ENABLED`
- Front : `NEXT_PUBLIC_API_URL` (finit par `/api`)

---

## 6. Dette / limites connues

- **Publicités** (`/admin/publicites`) : encore mock (aucun endpoint dédié).
- **Tunnel de réservation public** : doit envoyer `quantity` (défaut backend = 1) ; encore largement mock.
- **Paiement** = simulation.
- **Scan caméra** : saisie manuelle du QR (ajouter `html5-qrcode` pour lecture directe).
- **Cron** : tourne dans le process backend ; si Render met l'instance en veille (free tier), pas d'exécution pendant la veille.
- **Pagination** des listes admin : `limit=200` sans UI de pagination.
- `EventDetailSection` (accueil) + chronogramme/speakers home : encore basés sur `MOCK_EVENT` (vitrine).
- Icône PWA : un seul PNG pour toutes les tailles (exports dédiés 192/512 recommandés pour un rendu parfait).

---

## 7. Prochaines étapes suggérées

1. Brancher le **tunnel de réservation public** (sélection billet + quantité → `POST /bookings`).
2. Page **Publicités** admin + endpoints (bannières `PartnerBanner`).
3. Lecture **QR caméra** au scan.
4. Brancher `EventDetailSection`/chronogramme/speakers d'accueil sur l'événement vedette réel.
5. Pagination réelle des listes admin.
6. Exports dédiés des icônes PWA (192/512/maskable).
