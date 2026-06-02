# ============================================================================
# Backend Work Class Gabon — Dockerfile production (multi-stage).
# Situé à la racine du monorepo pour compatibilité Render.
# Build : `docker build -t wcg-backend .`
# Run   : `docker run --rm -p 3001:3001 --env-file backend/.env wcg-backend`
# ============================================================================

# ---- Stage 1 : deps (installe toutes les deps + génère Prisma client) -------
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

COPY backend/package.json backend/package-lock.json* ./
COPY backend/prisma ./prisma
# `npm ci` requiert un package-lock.json — fallback `npm install` sinon.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
RUN npx prisma generate

# ---- Stage 2 : builder (compile TypeScript) --------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./
RUN npm run build

# ---- Stage 3 : runner (image minimale runtime) -----------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Outils runtime nécessaires à Prisma + healthcheck.
RUN apk add --no-cache openssl libc6-compat curl

# Utilisateur non-root.
RUN addgroup -S app && adduser -S app -G app

# Deps de prod uniquement.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY backend/prisma ./prisma
COPY backend/package.json ./

# Élague les devDeps après copie pour réduire la taille de l'image.
RUN npm prune --omit=dev && \
    chown -R app:app /app

USER app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:${PORT}/api/health || exit 1

CMD ["node", "dist/server.js"]
