# Sécurité — Work Class Gabon

## Principes

1. **Defense in depth** : RLS + validation Zod + audit logs + rate limiting.
2. **Principe du moindre privilège** : aucun secret côté client. Tous les secrets (JWT, HMAC, DB, Redis, Resend) vivent dans `backend/.env`.
3. **RGPD-like** : consentement explicite, droit à l'oubli, IPs anonymisées.
4. **Logique métier 100 % backend** : le frontend n'exécute aucune règle de gestion sensible.
5. **POST obligatoire pour les données sensibles** : références, tokens, IDs, emails… jamais en query string GET (cf. `AI_RULES.md` § HTTP).

## Authentification

- Supabase Auth (email + password, 12 caractères minimum).
- 2FA TOTP recommandée pour les admins.
- Sessions JWT, expiration 1h.

## Autorisation (RBAC)

- Rôles : `public`, `admin`, `super_admin`.
- Permissions définies dans `src/constants/permissions.ts`.
- Mapping via `src/constants/rbac.ts` → `hasPermission(role, permission)`.

## Base de données

- **RLS activée sur toutes les tables** (migration `002_rls_policies.sql`).
- **Triggers d'audit** sur tables sensibles (migration `003_audit_triggers.sql`).
- **CHECK constraints** : prix ≥ 0, quotas, formats référence/billet.
- **Indexes** sur colonnes de recherche.

## QR codes et tokens

- QR : payload `{ ticketId, signature }` où `signature = HMAC-SHA256(ticketId, QR_HMAC_SECRET)`.
- Tokens d'avis : générés serveur, expiration + usage unique.
- **Toute vérification est serveur** — le client ne peut pas falsifier.

## Données personnelles (RGPD-like)

- Consentement explicite à la réservation (`consent_given`, `consent_at`).
- **Droit à l'oubli** : fonction d'anonymisation (`participants.anonymized_at`).
- Logs IP **anonymisés par préfixe** (cf. `anonymizeIp` dans `_shared/utils.ts`).
- Aucun log avec email/téléphone en clair.

## Secrets

- Tous les secrets sont dans des variables d'env (jamais hardcodés).
- Rotation conseillée : `QR_HMAC_SECRET`, `JWT_SECRET` tous les 6 mois.
- `.env.local` est dans `.gitignore`.

## Réseau

- Headers de sécurité : `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- CSP renforcée à compléter via middleware Vercel (étape Sécurité).
- Rate limiting : Upstash Redis (à activer en ÉTAPE 7).

## Incident response

1. Identifier l'incident → ouvrir une session dans `.tracking/SESSION_LOG.md`.
2. Révoquer / faire pivoter les secrets concernés.
3. Documenter dans `.tracking/ARCHITECTURE_DECISIONS.md` si décision structurelle.
4. Notifier les utilisateurs concernés si fuite de données personnelles (RGPD).
