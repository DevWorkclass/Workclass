# Contribuer à Work Class Gabon

## Workflow Git

- **Branches** : `main` (prod), `develop` (intégration), `feature/*`, `fix/*`, `chore/*`.
- **Commits** : format Conventional Commits en français (`feat: ...`, `fix: ...`, `chore: ...`).
- **Pull requests** : revue obligatoire par 1 reviewer, CI verte avant merge.

## Standards de code

- **TypeScript strict** : aucun `any`, `unknown` à valider via Zod.
- **DDD** : tout nouveau code va dans `src/domains/<context>/<domain>/{components,hooks,services,store,types}`.
- **Mobile-first** : commencer le CSS sans breakpoint, ajouter `md:`/`lg:` ensuite.
- **A11y** : conformité WCAG AA (focus visible, labels ARIA, contrastes).
- **Sécurité** : aucun secret en dur, RLS systématique côté Supabase.

## Tests

- Tests unitaires Vitest pour les utilitaires et hooks.
- Tests E2E Playwright pour les parcours critiques (réservation, scan).
- Toute Edge Function doit être livrée avec ses tests Deno (`deno test`).

## Process IA

Avant toute session IA :
1. Lire `.tracking/SESSION_LOG.md` + `BACKEND_TASKS.md` + `FILE_OWNERSHIP.md`.
2. Annoncer en 3-5 étapes ce qui sera fait.
3. Mettre à jour `.tracking/` après la session.

Voir [docs/ai/AI_RULES.md](../ai/AI_RULES.md) pour le détail.
