# Work Class Gabon — v1

> Plateforme PWA de réservation et gestion d'événements professionnels au Gabon.
> Monorepo Next.js 15 (frontend) + Node.js / Express / Prisma (backend) + PostgreSQL + Redis.

[![CI Backend](https://github.com/DevWorkclass/Workclass/actions/workflows/ci-backend.yml/badge.svg)](https://github.com/DevWorkclass/Workclass/actions/workflows/ci-backend.yml)
[![CI Frontend](https://github.com/DevWorkclass/Workclass/actions/workflows/ci-frontend.yml/badge.svg)](https://github.com/DevWorkclass/Workclass/actions/workflows/ci-frontend.yml)

## Sommaire

- [Fonctionnalités v1](#fonctionnalités-v1)
- [Structure du monorepo](#structure-du-monorepo)
- [Stack technique](#stack-technique)
- [Démarrage local](#démarrage-local)
- [Variables d'environnement](#variables-denvironnement)
- [Commandes utiles](#commandes-utiles)
- [Déploiement](#déploiement)
- [Documentation](#documentation)
- [Licence](#licence)

## Fonctionnalités v1

- 🎟️ Réservation de billets (formulaire multi-étapes, génération de référence `WCG-RES-XXXXXX`)
- 📄 Génération de billets PDF avec QR code signé HMAC-SHA256
- 📷 Scan de QR à l'entrée + génération automatique du certificat de participation
- 📧 Emails transactionnels (Resend, mode simulation en dev)
- ⭐ Système d'avis post-événement (liens uniques expirables + modération admin)
- 💳 Paiement v1 : placeholder simulation (architecture webhook-ready pour v2)
- 🔐 Auth admin JWT (bcrypt) + RBAC (`admin` / `super_admin`)
- 📊 Audit logs RGPD-friendly (IPs anonymisées)
- 🌍 i18n fr / en (next-intl)
- 📱 PWA (manifest + service worker)

## Structure du monorepo

```text
work-class-gabon/
├── frontend/          # Next.js 15 (App Router) + Tailwind + shadcn/ui
├── backend/           # Node.js + Express + Prisma + Redis
│   ├── prisma/        # schema.prisma (source de vérité — db push)
│   └── src/domains/   # DDD : auth / users / booking / tickets / scan / feedback / payments / notifications / shared
├── docs/              # Architecture, Design System, Sécurité, Déploiement, Règles IA
├── .github/workflows/ # CI Frontend + Backend
├── docker-compose.yml # PostgreSQL + Redis + frontend + backend (dev)
├── render.yaml        # Blueprint Render (backend prod)
└── vercel.json        # Config Vercel (frontend prod)
```

## Stack technique

| Couche          | Technologies                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Frontend        | Next.js 15, React 19, TypeScript strict, Tailwind, shadcn/ui, Zustand, react-hook-form, next-intl |
| Backend         | Node.js 20+, Express, TypeScript strict, Prisma 5, Zod                                            |
| Base de données | PostgreSQL 16 (Supabase ou self-hosted)                                                           |
| Cache           | Redis 7 (Upstash ou self-hosted)                                                                  |
| PDF / QR        | pdfkit + qrcode (HMAC-SHA256)                                                                     |
| Emails          | Resend                                                                                            |
| Auth            | JWT HS256 + bcryptjs (12 rounds)                                                                  |
| CI/CD           | GitHub Actions + Vercel + Render                                                                  |

## Démarrage local

### Prérequis

- Node.js 20+
- npm 10+
- Docker Desktop (pour PostgreSQL + Redis locaux)

### Installation

```bash
# 1) Cloner le dépôt
git clone https://github.com/DevWorkclass/Workclass.git
cd Workclass

# 2) Installer les dépendances (workspaces)
npm install --legacy-peer-deps

# 3) Configurer l'environnement
cp frontend/.env.example frontend/.env.local
cp backend/.env.example  backend/.env.local

# 4) Lancer PostgreSQL + Redis
npm run db:up

# 5) Initialiser la base (schema.prisma = source de vérité, db push)
cd backend
npx prisma generate
npx prisma db push
cd ..
npm run db:seed

# 6) Lancer en dev (deux terminaux)
npm run dev:backend     # http://localhost:3001
npm run dev:frontend    # http://localhost:3000
```

Vérification : `curl http://localhost:3001/api/health` → `{ "success": true, "data": { "status": "ok" } }`.

## Variables d'environnement

Chaque workspace a son `.env.example` :

- [`frontend/.env.example`](frontend/.env.example) — variables `NEXT_PUBLIC_*` + URL API backend.
- [`backend/.env.example`](backend/.env.example) — `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `QR_HMAC_SECRET`, `RESEND_API_KEY`, etc.

**Aucun secret ne doit être committé.** En production, configurer les variables via Vercel / Render Dashboard.

## Commandes utiles

| Commande               | Description                                       |
|------------------------|---------------------------------------------------|
| `npm run dev:frontend` | Démarre Next.js (port 3000)                       |
| `npm run dev:backend`  | Démarre Express (port 3001)                       |
| `npm run build`        | Build des deux workspaces                         |
| `npm run lint`         | Lint des deux workspaces                          |
| `npm run typecheck`    | TypeScript des deux workspaces                    |
| `npm run db:up`        | Lance PostgreSQL + Redis (Docker)                 |
| `npm run db:down`      | Arrête les services Docker                        |
| `npm run db:migrate`   | Prisma migrate dev                                |
| `npm run db:deploy`    | Prisma migrate deploy (staging/prod)              |
| `npm run db:seed`      | Exécute `backend/seed.ts`                         |
| `npm run db:studio`    | Ouvre Prisma Studio                               |

## Déploiement

**Architecture cible** :

- **Frontend** → [Vercel](https://vercel.com) (Next.js auto-détecté).
- **Backend** → [Render](https://render.com) Web Service (Dockerfile multi-stage prêt).
- **Base de données** → [Supabase](https://supabase.com) (PostgreSQL managé + Storage si besoin).
- **Cache** → [Upstash](https://upstash.com) Redis (optionnel — fallback in-memory).
- **Emails** → [Resend](https://resend.com).

Voir le [guide de déploiement complet](docs/operations/DEPLOYMENT.md) — étape par étape, secrets à configurer, post-deploy checks.

## Documentation

- 🏛️ [Architecture](docs/architecture/ARCHITECTURE.md)
- 🎨 [Design System](docs/design/DESIGN_SYSTEM.md)
- 🤖 [Règles IA / Conventions](docs/ai/AI_RULES.md)
- 🚀 [Déploiement](docs/operations/DEPLOYMENT.md)
- 🔐 [Sécurité & RGPD](docs/operations/SECURITY.md)
- 📜 [Standards de fichiers](docs/standards/FICHIERS_STANDARDS.md)
- 🤝 [Contribuer](docs/project/CONTRIBUTING.md)

## Licence

Propriétaire — Work Class Gabon © 2026. Tous droits réservés.
