/**
 * Client Supabase côté serveur (Service Role Key).
 * NE JAMAIS exposer ce client au navigateur.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

import WebSocket from 'ws';

let cached: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient {
  if (cached) return cached;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.');
  }
  cached = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: {
      transport: WebSocket as any
    }
  });
  return cached;
}
