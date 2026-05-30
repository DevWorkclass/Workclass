# Architecture — Work Class Gabon v1

## Vue d'ensemble

PWA Next.js 15 (App Router) déployée sur **Vercel**, adossée à un backend **Express + Prisma + Redis** (Node.js 20). PostgreSQL 16 comme base. **Toute la logique métier vit côté backend** ; le frontend ne fait que de l'affichage et des appels API typés.

```mermaid
flowchart LR
  U[Utilisateur public] -->|HTTPS| FE[Frontend Next.js<br/>Vercel]
  A[Admin] -->|HTTPS auth| FE
  FE -->|POST /api| BE[Backend Express<br/>Node.js + Prisma]
  BE -->|SQL| DB[(PostgreSQL 16)]
  BE -->|cache + rate-limit| R[(Redis)]
  BE -->|API| MAIL[Resend]
  BE -->|HMAC sign| QR[QR signés]
  BE -->|pdf-lib| PDF[PDF tickets + certificats]
```

**Monorepo** : `frontend/` (Next.js) + `backend/` (Express + Prisma + Redis). Le **backend Express** est l'API principale et porte **toute la logique métier** (génération PDF/QR signés HMAC, audit, rate-limit, auth admin).

> **Règle de sécurité** : toute requête manipulant des données sensibles (référence, token, id, email…) est en **POST** avec body JSON. Les GET sont réservés au healthcheck et aux ressources publiques non sensibles. Cf. `docs/ai/AI_RULES.md` § HTTP.

## Couches

| Couche                | Responsabilités                                                |
|-----------------------|----------------------------------------------------------------|
| **UI (frontend/)**    | Next.js App Router, Tailwind + shadcn, layouts publics/admin   |
| **Domaines**          | DDD : `public/*`, `admin/*`, `shared/*`                        |
| **API (backend/)**    | Express + Zod + DDD (controllers/services/repositories), JWT   |
| **Persistance**       | Prisma (ORM) + PostgreSQL + migrations SQL versionnées         |
| **Cache / rate-limit**| Redis (distribué, multi-instances)                             |

## Flux de réservation

```mermaid
sequenceDiagram
  participant U as Utilisateur
  participant W as Frontend (Next.js)
  participant API as Backend Express
  participant DB as PostgreSQL
  U->>W: Remplit le formulaire (étapes 1-5)
  W->>API: POST /api/booking/create
  API->>API: Zod validate + audit
  API->>DB: Prisma transaction (bookings + participants)
  DB-->>API: reference WCG-RES-XXXXXX
  API->>API: Enqueue génération ticket (job)
  API-->>W: { reference, status: pending }
  W-->>U: /reservation/confirmation
```

## Flux de scan

```mermaid
sequenceDiagram
  participant S as Scanner (PWA admin)
  participant API as Backend Express
  participant DB as PostgreSQL
  S->>API: POST /api/scan/verify { qrPayload }
  API->>API: Vérifie HMAC-SHA256
  API->>DB: Prisma findTicket
  alt valide & non scanné
    API->>DB: UPDATE scanned_at
    API->>API: POST /api/scan/confirm → certificat PDF + email
    API-->>S: { status: valid }
  else déjà scanné
    API-->>S: { status: invalid, error: already_scanned }
  end
```

## Flux de feedback

```mermaid
sequenceDiagram
  participant Sys as Système (job cron)
  participant P as Participant
  participant API as Backend Express
  participant DB as PostgreSQL
  Sys->>P: Email avec lien unique /avis/:token
  P->>API: POST /api/feedback/validate { token }
  API->>DB: Vérifie token (non utilisé, non expiré)
  P->>API: POST /api/feedback/submit { token, ratings, comment }
  API->>DB: INSERT feedback_responses + UPDATE feedback_links.used
  API-->>P: { success: true }
```

## Sécurité

- **JWT HS256** pour les admins (`backend/src/domains/shared/auth`).
- **bcryptjs** pour les hash de mots de passe (`Admin.passwordHash`).
- **QR codes** signés HMAC-SHA256, vérification serveur exclusive (`utils/crypto.ts` + `utils/qr-generator.ts`).
- **RLS PostgreSQL** maintenue via migrations SQL brutes (`backend/prisma/migrations/002_rls_policies/`) — défense en profondeur.
- **Audit logs** automatiques via triggers (`backend/prisma/migrations/003_audit_triggers/`) + service `auditService`.
- **IPs anonymisées** dans les logs (`utils/crypto.anonymizeIp` + Pino redact).
- **Rate-limit** distribué via Redis (`express-rate-limit` + ioredis).
- **POST obligatoire** pour toutes les données sensibles (cf. AI_RULES.md).
