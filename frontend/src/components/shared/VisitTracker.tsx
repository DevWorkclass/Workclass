'use client';

/**
 * Ping le compteur de visites backend une fois par session navigateur.
 * Aucune donnée personnelle envoyée — simple incrément côté serveur.
 */
import { useEffect } from 'react';

import { apiFetch } from '@/lib/api';

const SESSION_FLAG = 'wcg-visit-tracked';

export function VisitTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    sessionStorage.setItem(SESSION_FLAG, '1');
    // Échec silencieux : une visite non comptée ne doit pas gêner l'utilisateur.
    apiFetch('/metrics/visit', { method: 'POST', body: '{}' }).catch(() => {});
  }, []);

  return null;
}
