/**
 * Cache mémoire court côté client pour les événements publics.
 * Toutes les requêtes simultanées partagent la même Promise (pas de doublon réseau).
 * Validité : 20 s (places restantes proches du temps réel) + invalidation
 * explicite après une action utilisateur (réservation, annulation).
 */
import { apiFetch } from '@/lib/api';
import type { PublicEvent } from '@/lib/public-event';

const TTL_MS = 20 * 1_000;

let cached: PublicEvent[] | null = null;
let cachedAt = 0;
let pending: Promise<PublicEvent[]> | null = null;

export async function getPublicEvents(): Promise<PublicEvent[]> {
  if (cached && Date.now() - cachedAt < TTL_MS) return cached;
  if (pending) return pending;

  pending = apiFetch<{ data: PublicEvent[] }>('/public/events')
    .then((res) => {
      cached = res.data;
      cachedAt = Date.now();
      pending = null;
      return res.data;
    })
    .catch((err) => {
      pending = null;
      throw err;
    });

  return pending;
}

/** Invalide le cache : à appeler après réservation, annulation, retour de tab. */
export function invalidatePublicEvents(): void {
  cached = null;
  cachedAt = 0;
}
