/**
 * Configuration Orval — Génération de clients API typés.
 * Placeholder v1 : à activer dès qu'une spec OpenAPI sera disponible
 * pour les Edge Functions (étape Core API).
 */
import type { Config } from '@orval/core';

const config: Config = {
  workclass: {
    input: {
      target: './openapi/workclass.openapi.yaml',
    },
    output: {
      mode: 'tags-split',
      target: './src/lib/api/generated',
      schemas: './src/lib/api/generated/schemas',
      client: 'fetch',
      prettier: true,
      override: {
        mutator: {
          path: './src/lib/api/fetcher.ts',
          name: 'customFetcher',
        },
      },
    },
  },
};

export default config;
