'use client';

/**
 * Enregistre le service worker PWA (/sw.js).
 *  - Uniquement en production (évite les conflits avec le HMR Next dev).
 *  - Désinstalle proprement le SW si la fonctionnalité est désactivée
 *    (NEXT_PUBLIC_PWA_DISABLED=true) pour éviter de bloquer un rollback.
 *  - Aucun effet sur les requêtes API : voir /public/sw.js (scope strict).
 */
import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const disabled = process.env.NEXT_PUBLIC_PWA_DISABLED === 'true';
    const isProd = process.env.NODE_ENV === 'production';

    if (disabled || !isProd) {
      // Cleanup : désenregistre tout SW résiduel.
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) void r.unregister();
      });
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {
          /* échec silencieux : la PWA dégrade en site web classique */
        });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
