# Règles IA — Work Class Gabon

Ce document est la **source de vérité** pour toute IA contribuant au code (Claude, Cursor, Copilot, etc.).

## Règles transverses

1. **Langue** : tout commentaire, doc, commit, log → en français.
2. **TypeScript strict** : interdiction absolue de `any`. Préférer `unknown` + validation Zod.
3. **DDD** : tout nouveau code va dans `src/domains/<context>/<domain>/{components,hooks,services,store,types}`.
4. **Mobile-first** : commencer le CSS sans breakpoint.
5. **A11y AA** : labels ARIA, focus visible, navigation clavier.
6. **Sécurité avant fonctionnalité** : RLS, HMAC, validation Zod systématique.

## Backend Express (`backend/`)

- Toujours valider les inputs avec **Zod** avant traitement (middleware ou inline).
- Toujours utiliser le **Service Role Key** côté serveur uniquement (env vars `backend/.env`).
- Toujours **signer** les QR codes (HMAC-SHA256) — la signature est vérifiée côté Express.
- Toujours **logger** dans `audit_logs` (via triggers ou service `auditService`).
- Toujours **anonymiser** les IPs avant log (RGPD) — voir Pino `redact`.
- Respecter la structure : `src/{config,middleware,routes,services,types,utils}/`.

## Frontend (`frontend/`)

- **Aucune logique métier** côté frontend. Toute règle de gestion (quota, calcul de prix, génération de référence, validation business, signature) vit côté backend Express. Le frontend = affichage + appels API typés + validation cosmétique des formulaires.
- Aucun appel à la **Service Role Key** côté client.
- Aucune **génération PDF / QR** côté client (stubs autorisés, mais la vraie génération est serveur).
- Les routes sont définies dans `src/constants/routes.ts` — **ne jamais hardcoder** une URL dans le JSX.
- Les endpoints API sont dans `src/constants/api-endpoints.ts`.

## HTTP — POST obligatoire pour les données sensibles

**Toute requête manipulant des données sensibles est POST avec body JSON. Jamais GET.**

Sont considérés sensibles : références de réservation (`WCG-RES-XXXXXX`), numéros de billets, tokens d'avis, IDs internes, emails, téléphones, et tout filtre admin nominatif.

| ❌ Interdit (GET avec données sensibles)        | ✅ À utiliser (POST + body)                            |
|--------------------------------------------------|---------------------------------------------------------|
| `GET /api/booking/:reference`                    | `POST /api/booking/lookup` body `{ reference }`         |
| `GET /api/tickets/:id`                           | `POST /api/tickets/get` body `{ ticketId }`             |
| `GET /api/feedback/:token`                       | `POST /api/feedback/validate` body `{ token }`          |
| `GET /api/admin/bookings?email=...`              | `POST /api/admin/bookings/search` body `{ email }`      |

**Raison** : les URLs (GET) sont enregistrées par les proxys, l'historique navigateur, le Referer, les logs CDN/Vercel. Mettre une référence ou un token dans l'URL = fuite involontaire.

**Exceptions autorisées (GET sans risque)** : `/api/health`, ressources publiques non sensibles (liste d'événements publiés sans filtre nominatif).

## Workflow IA

**Avant** chaque session :
1. Lire `.tracking/BACKEND_TASKS.md` (état du backlog).
2. Lire `.tracking/SESSION_LOG.md` (historique).
3. Vérifier `.tracking/FILE_OWNERSHIP.md` pour éviter les conflits.

**Pendant** :
1. Annoncer en 3-5 étapes ce qui sera fait.
2. Coder propre, commenté en français, JSDoc sur les fonctions publiques.
3. Inclure des tests (Vitest / Deno / Playwright selon le contexte).

**Après** :
1. Mettre à jour `.tracking/SESSION_LOG.md` (nouvelle entrée en tête).
2. Mettre à jour `.tracking/BACKEND_TASKS.md` (cocher les tâches faites).
3. Mettre à jour `.tracking/PROGRESS.md` (recalculer %).
4. Si décision architecturale → `.tracking/ARCHITECTURE_DECISIONS.md`.

## Interdictions strictes

- ❌ `any` en TypeScript.
- ❌ Génération PDF/QR côté client.
- ❌ Service Role Key côté client.
- ❌ Mots de passe en clair (toujours Supabase Auth).
- ❌ Logs avec données personnelles (email, téléphone, CB).
- ❌ Modifier `src/components/ui/` (shadcn) directement.
- ❌ Bypass RLS sans justification documentée.
- ❌ Commit de `.env.local`, `.tracking/`, ou secrets.
