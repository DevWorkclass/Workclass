# Work Class Gabon — v1 (monorepo)

Plateforme PWA de réservation et gestion d'événements professionnels au Gabon.

## Structure

```
work-class-gabon/
├── frontend/          # Next.js 15 (App Router) + Tailwind + shadcn/ui (PWA)
├── backend/           # Node.js + Express + Prisma + Redis (toute la logique métier)
├── docs/              # Documentation projet
├── .github/workflows/ # CI/CD (frontend + backend)
├── .tracking/         # Suivi interne (masqué — voir .gitignore)
└── docker-compose.yml # postgres + redis + backend + frontend (dev local)
```

## Stack

| Workspace  | Technologies                                                       |
|------------|--------------------------------------------------------------------|
| `frontend` | Next.js 15, React 19, TypeScript strict, Tailwind, shadcn/ui       |
| `backend`  | Node.js 20+, Express, Prisma, PostgreSQL, Redis, Zod, Helmet, Pino |
| Infra      | PostgreSQL 16, Redis 7 (via docker compose)                        |

## Démarrage rapide

```bash
# 1) Installer les dépendances (workspaces)
npm install

# 2) Variables d'env (par workspace)
cp frontend/.env.example frontend/.env.local
cp backend/.env.example  backend/.env.local

# 3) Lancer postgres + redis en local
npm run db:up

# 4) Appliquer migrations + seed
npm run db:migrate        # prisma migrate dev
npm run db:seed           # seed.ts

# 5) Lancer frontend + backend (terminaux séparés)
npm run dev:frontend      # http://localhost:3000
npm run dev:backend       # http://localhost:3001
```

## Commandes racine

| Commande               | Description                                       |
|------------------------|---------------------------------------------------|
| `npm run dev:frontend` | Démarre Next.js (port 3000)                       |
| `npm run dev:backend`  | Démarre Express (port 3001)                       |
| `npm run build`        | Build des deux workspaces                         |
| `npm run lint`         | Lint des deux workspaces                          |
| `npm run typecheck`    | TypeScript des deux workspaces                    |
| `npm test`             | Tests des deux workspaces                         |
| `npm run db:up`        | Lance postgres + redis (Docker)                   |
| `npm run db:down`      | Arrête les services Docker                        |
| `npm run db:migrate`   | Prisma migrate dev (dev)                          |
| `npm run db:deploy`    | Prisma migrate deploy (prod/staging)              |
| `npm run db:seed`      | Exécute `backend/seed.ts`                         |
| `npm run db:studio`    | Ouvre Prisma Studio                               |

## Documentation

- [Architecture](docs/architecture/ARCHITECTURE.md)
- [Design System](docs/design/DESIGN_SYSTEM.md)
- [Règles IA](docs/ai/AI_RULES.md)
- [Déploiement](docs/operations/DEPLOYMENT.md)
- [Sécurité](docs/operations/SECURITY.md)

## Licence

Propriétaire — Work Class Gabon © 2026.
