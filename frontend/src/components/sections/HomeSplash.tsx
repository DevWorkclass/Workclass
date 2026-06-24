'use client';

/**
 * Écran de chargement d'accueil — logo Work Class affiché sur la première section
 * pendant le chargement initial, puis disparaît en fondu.
 * S'efface au chargement complet de la page (event `load`) ou après un court délai.
 */
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function HomeSplash() {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    // Cache le splash dès que la page est prête (ou au plus tard après 1,4 s).
    const hide = () => setHidden(true);
    const maxDelay = setTimeout(hide, 1400);
    if (document.readyState === 'complete') {
      const t = setTimeout(hide, 400);
      return () => {
        clearTimeout(t);
        clearTimeout(maxDelay);
      };
    }
    window.addEventListener('load', hide, { once: true });
    return () => {
      window.removeEventListener('load', hide);
      clearTimeout(maxDelay);
    };
  }, []);

  // Retire du DOM après le fondu (300 ms).
  useEffect(() => {
    if (!hidden) return;
    const t = setTimeout(() => setRemoved(true), 350);
    return () => clearTimeout(t);
  }, [hidden]);

  if (removed) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] grid place-items-center bg-brand-navy transition-opacity duration-300 ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/assets/images/logo/logo.png"
          alt="Work Class"
          width={180}
          height={180}
          priority
          className="h-auto w-40 animate-pulse sm:w-48"
        />
        <span className="size-7 animate-spin rounded-full border-2 border-brand-gold border-r-transparent" />
      </div>
    </div>
  );
}
