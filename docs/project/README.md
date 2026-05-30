# Work Class Gabon — Guide projet

## Présentation

Work Class Gabon v1 est une **PWA** (Progressive Web App) de réservation et de gestion d'événements professionnels au Gabon. Elle est pensée mobile-first et évoluera vers une app native (v2/v3).

## Stack

| Couche       | Technologie                                     |
|--------------|-------------------------------------------------|
| Frontend     | Next.js 15 (App Router) + TypeScript strict     |
| UI           | Tailwind CSS + shadcn/ui                        |
| État         | Zustand                                         |
| Formulaires  | react-hook-form + Zod                           |
| i18n         | next-intl (fr / en)                             |
| Backend      | Supabase (PostgreSQL + Auth + Storage + Edge)   |
| Emails       | Resend                                          |
| PDF / QR     | pdf-lib + qrcode (Edge Functions uniquement)    |
| CI/CD        | GitHub Actions + Vercel                         |

## Installation locale (monorepo npm workspaces)

```bash
# 1) Installer les dépendances des deux workspaces
npm install

# 2) Variables d'env (par workspace)
cp frontend/.env.example frontend/.env.local
cp backend/.env.example  backend/.env.local

# 3) Supabase local
npm run db:start
npm run db:reset

# 4) Lancer frontend + backend (terminaux séparés)
npm run dev:frontend   # http://localhost:3000
npm run dev:backend    # http://localhost:4000
```

## Structure de dossiers (résumé)

```
src/
├── app/              # Next.js App Router (public + admin)
├── components/       # Layouts + composants partagés + shadcn ui/
├── domains/          # DDD : public / admin / shared
├── design-system/    # Tokens, thèmes, patterns, templates
├── lib/              # Utils, validators, sanitizers, formatters
├── constants/        # Routes, endpoints, permissions, RBAC
├── config/           # App, Supabase, i18n, PWA
├── styles/           # globals.css + variables.css
└── locales/          # fr.json + en.json

supabase/
├── migrations/       # SQL versionnées (RLS + audit)
├── functions/        # Edge Functions Deno
└── seed.sql
```

## Commandes

| Commande           | Description                              |
|--------------------|------------------------------------------|
| `npm run dev`      | Serveur Next.js (port 3000)              |
| `npm run build`    | Build production                         |
| `npm run lint`     | ESLint                                   |
| `npm run typecheck`| Vérification TypeScript                  |
| `npm test`         | Tests unitaires Vitest                   |
| `npm run test:e2e` | Tests E2E Playwright                     |
| `npm run db:reset` | Reset DB + seed                          |
| `npm run db:types` | Génère les types Supabase                |
