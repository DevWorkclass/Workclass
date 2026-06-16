'use client';

/**
 * Hook de carrousel horizontal en boucle infinie.
 *
 *  - Défilement automatique continu (`speedPxPerSec`) via `requestAnimationFrame`.
 *  - Pause au survol / focus.
 *  - Drag souris + swipe tactile : l'utilisateur peut faire défiler manuellement,
 *    le défilement automatique reprend à la fin du drag.
 *  - Boucle sans couture : l'appelant doit dupliquer les éléments (× 2) ;
 *    le hook recale automatiquement la translation quand `offset` dépasse
 *    la moitié de la largeur totale du track.
 *
 * Usage :
 *   const { containerRef, trackRef, dragProps } = useInfiniteMarquee({ speed: 40 });
 *   <div ref={containerRef} {...dragProps} className="overflow-hidden">
 *     <div ref={trackRef} className="flex w-max gap-6">{[...items, ...items]}</div>
 *   </div>
 */
import { useCallback, useEffect, useRef } from 'react';

interface Options {
  /** Vitesse en pixels par seconde. Défaut 40 px/s (très fluide). */
  speed?: number;
  /** Désactive le défilement auto (utile si une seule carte). */
  enabled?: boolean;
  /**
   * Mode de boucle :
   *  - `loop` (défaut) : l'appelant duplique le contenu (× 2), boucle sans couture.
   *  - `pingpong` : un seul passage des éléments, l'animation rebondit aux extrémités.
   */
  mode?: 'loop' | 'pingpong';
}

interface DragProps {
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: (e: React.PointerEvent<HTMLDivElement>) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocusCapture: () => void;
  onBlurCapture: () => void;
}

export function useInfiniteMarquee({
  speed = 40,
  enabled = true,
  mode = 'loop',
}: Options = {}): {
  containerRef: React.RefObject<HTMLDivElement | null>;
  trackRef: React.RefObject<HTMLDivElement | null>;
  dragProps: DragProps;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Offset courant (en pixels).
  const offsetRef = useRef(0);
  // Sens en mode pingpong (1 = vers la droite des éléments, -1 = retour).
  const dirRef = useRef<1 | -1>(1);
  // Drapeau « pause » (hover, focus, drag en cours).
  const pausedRef = useRef(false);
  // État du drag.
  const dragRef = useRef<{ active: boolean; startX: number; startOffset: number; pointerId: number | null }>(
    { active: false, startX: 0, startOffset: 0, pointerId: null },
  );

  const apply = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    }
  }, []);

  /** Recale l'offset selon le mode (loop : modulo demi-largeur ; pingpong : rebond). */
  const normalize = useCallback(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track) return;

    if (mode === 'loop') {
      // Période de boucle = largeur exacte d'un « groupe » d'items.
      // Si le track contient exactement 2 enfants (structure recommandée :
      // deux groupes identiques), on utilise la largeur du 1er + le gap.
      // Sinon, on retombe sur scrollWidth / 2 (peut introduire un drift d'un
      // demi-gap quand on duplique des items individuels avec gap-x).
      let period = track.scrollWidth / 2;
      const first = track.firstElementChild as HTMLElement | null;
      if (first && track.children.length === 2) {
        const gap = parseFloat(globalThis.getComputedStyle(track).columnGap || '0') || 0;
        period = first.offsetWidth + gap;
      }
      if (period <= 0) return;
      if (offsetRef.current >= period) offsetRef.current -= period;
      else if (offsetRef.current < 0) offsetRef.current += period;
      return;
    }

    // pingpong : rebondit entre 0 et (scrollWidth - containerWidth).
    const max = Math.max(0, track.scrollWidth - (container?.clientWidth ?? 0));
    if (max <= 0) {
      offsetRef.current = 0;
      return;
    }
    if (offsetRef.current >= max) {
      offsetRef.current = max;
      dirRef.current = -1;
    } else if (offsetRef.current <= 0) {
      offsetRef.current = 0;
      dirRef.current = 1;
    }
  }, [mode]);

  // Boucle d'animation.
  useEffect(() => {
    if (!enabled) return;
    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!pausedRef.current && !dragRef.current.active) {
        const sign = mode === 'pingpong' ? dirRef.current : 1;
        offsetRef.current += sign * speed * dt;
        normalize();
        apply();
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [apply, enabled, mode, normalize, speed]);

  // Repositionne après mount / changement du contenu.
  useEffect(() => {
    apply();
  }, [apply]);

  const dragProps: DragProps = {
    onPointerDown: (e) => {
      const container = containerRef.current;
      if (!container) return;
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startOffset: offsetRef.current,
        pointerId: e.pointerId,
      };
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        /* certains navigateurs refusent capture sur input type=button — ignoré */
      }
    },
    onPointerMove: (e) => {
      if (!dragRef.current.active) return;
      const delta = e.clientX - dragRef.current.startX;
      offsetRef.current = dragRef.current.startOffset - delta;
      normalize();
      apply();
    },
    onPointerUp: () => {
      const container = containerRef.current;
      if (dragRef.current.pointerId !== null && container) {
        try {
          container.releasePointerCapture(dragRef.current.pointerId);
        } catch {
          /* ignore */
        }
      }
      dragRef.current = { active: false, startX: 0, startOffset: 0, pointerId: null };
    },
    onPointerLeave: () => {
      dragRef.current = { active: false, startX: 0, startOffset: 0, pointerId: null };
    },
    onMouseEnter: () => {
      pausedRef.current = true;
    },
    onMouseLeave: () => {
      pausedRef.current = false;
    },
    onFocusCapture: () => {
      pausedRef.current = true;
    },
    onBlurCapture: () => {
      pausedRef.current = false;
    },
  };

  return { containerRef, trackRef, dragProps };
}
