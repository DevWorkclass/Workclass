# Standards de fichiers — Work Class Gabon

## Conventions de nommage

| Type                   | Casse              | Exemple                          |
|------------------------|--------------------|----------------------------------|
| Composants React       | PascalCase         | `BookingForm.tsx`                |
| Hooks                  | camelCase + `use`  | `useBookingDraft.ts`             |
| Services / utilitaires | camelCase          | `bookingService.ts`              |
| Types / interfaces     | PascalCase         | `BookingInput`                   |
| Constantes globales    | SCREAMING_SNAKE    | `API_ENDPOINTS`, `ROUTES`        |
| Fichiers de constantes | kebab-case         | `api-endpoints.ts`               |
| Tests                  | `*.test.ts(x)`     | `bookingService.test.ts`         |
| Migrations SQL         | `NNN_description`  | `001_init_schema.sql`            |

## Structure d'un domaine DDD

```
src/domains/<context>/<domain>/
├── components/   # Composants spécifiques au domaine
├── hooks/        # Hooks React
├── services/     # Appels API + transformations
├── store/        # Zustand store(s) du domaine
└── types/        # <domain>.types.ts (1 fichier par domaine)
```

## Template d'une Edge Function

```ts
import { z } from 'https://esm.sh/zod@3';
import { buildRequestContext, errorResponse, jsonResponse } from '../../_shared/utils.ts';

const inputSchema = z.object({ /* ... */ });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return errorResponse('method_not_allowed', '...', 405);
  const ctx = buildRequestContext(req);
  try {
    const parsed = inputSchema.parse(await req.json());
    // logique métier
    return jsonResponse({ success: true, data: { /* ... */ } });
  } catch (err) {
    if (err instanceof z.ZodError) return errorResponse('validation_error', 'Données invalides', 422);
    console.error('[function-name]', ctx.requestId, err);
    return errorResponse('internal_error', 'Erreur interne', 500);
  }
});
```

## Template d'une migration SQL

```sql
-- ============================================================================
-- Migration NNN — Description courte
-- ============================================================================

-- Création / modification
-- ...

-- Indexes
-- ...

-- RLS / policies (si applicable)
-- ...
```
