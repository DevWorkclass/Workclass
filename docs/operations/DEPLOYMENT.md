# Déploiement — Work Class Gabon

## Environnements

| Env         | URL                                  | Backend                  |
|-------------|--------------------------------------|--------------------------|
| Dev local   | `http://localhost:3000`              | Supabase local (CLI)     |
| Staging     | `staging.workclass-gabon.com`        | Projet Supabase staging  |
| Production  | `workclass-gabon.com`                | Projet Supabase prod     |

## Vercel (Frontend Next.js)

1. Lier le repo GitHub au projet Vercel.
2. **Root Directory** : `frontend` (Vercel détecte Next.js).
3. Définir les variables d'environnement (cf. `frontend/.env.example`).
4. Branche `main` → prod, `develop` → preview staging.
5. Domaine custom + HTTPS automatique.

## Backend Express (Render — recommandé v1)

1. Créer un **Web Service** sur [Render](https://render.com).
2. **Root Directory** : `backend`.
3. Build command : `npm install && npm run build`.
4. Start command : `npm start`.
5. Variables d'env : cf. `backend/.env.example` (Service Role Key, HMAC, Resend…).
6. Health check : `/api/health`.

Alternatives : Fly.io, Railway, ou Vercel Serverless Functions (avec adaptation).

## Supabase (Backend)

1. Créer un projet Supabase par environnement.
2. Lier le projet CLI :
   ```bash
   supabase link --project-ref <project-id>
   ```
3. Pousser les migrations :
   ```bash
   npm run db:migrate
   ```
4. Déployer les Edge Functions :
   ```bash
   npm run functions:deploy
   ```
5. Configurer les secrets serveur (Dashboard → Settings → Edge Functions) :
   - `QR_HMAC_SECRET`
   - `FEEDBACK_TOKEN_SECRET`
   - `JWT_SECRET`
   - `RESEND_API_KEY`
   - `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`

## GitHub Actions

- Workflow `ci.yml` exécute : lint, typecheck, tests, build sur chaque PR.
- Le déploiement réel est délégué à Vercel (auto sur `main` / `develop`).

## Rollback

- **Vercel** : redéployer une version antérieure via le Dashboard.
- **Supabase** : appliquer une migration de rollback dédiée (jamais de drop direct en prod).
