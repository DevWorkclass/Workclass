'use client';

/**
 * Hook : compte admin courant (depuis la session localStorage).
 * Lecture en effet pour éviter tout mismatch d'hydratation (le serveur n'a pas
 * accès au localStorage). `loading` distingue « pas encore lu » de « non connecté ».
 */
import { useEffect, useState } from 'react';

import { getSession, type AdminUser } from '@/lib/auth';

export function useAuthUser(): { user: AdminUser | null; loading: boolean } {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getSession()?.user ?? null);
    setLoading(false);
  }, []);

  return { user, loading };
}
