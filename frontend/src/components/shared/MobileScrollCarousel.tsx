'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface MobileScrollCarouselProps {
  count: number;
  children: ReactNode;
  className?: string;
}

export function MobileScrollCarousel({ count, children, className }: MobileScrollCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Refs stables — évitent les dépendances cycliques dans les effets.
  const activeRef = useRef(0);
  const pauseRef = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout>>();
  // Empêche que le scroll programmatique déclenche la pause.
  const isProgrammaticRef = useRef(false);

  const goTo = useCallback(
    (index: number) => {
      const el = containerRef.current;
      if (!el) return;
      const firstCard = el.firstElementChild as HTMLElement | null;
      if (!firstCard) return;
      const step = firstCard.offsetWidth + 16; // carte + gap-4
      isProgrammaticRef.current = true;
      el.scrollTo({ left: index * step, behavior: 'smooth' });
      setActive(index);
      activeRef.current = index;
      // Durée approximative du scroll smooth (~400 ms).
      setTimeout(() => {
        isProgrammaticRef.current = false;
      }, 450);
    },
    [],
  );

  // Auto-avancement toutes les 3,5 s.
  useEffect(() => {
    const tick = setInterval(() => {
      if (!pauseRef.current) {
        goTo((activeRef.current + 1) % count);
      }
    }, 3500);
    return () => clearInterval(tick);
  }, [count, goTo]);

  // Mise à jour du dot actif + pause après interaction manuelle.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onScroll() {
      const firstCard = el!.firstElementChild as HTMLElement | null;
      if (!firstCard) return;
      const step = firstCard.offsetWidth + 16;
      const idx = Math.min(count - 1, Math.max(0, Math.round(el!.scrollLeft / step)));
      setActive(idx);
      activeRef.current = idx;

      // Pause seulement si l'utilisateur fait défiler lui-même.
      if (!isProgrammaticRef.current) {
        pauseRef.current = true;
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = setTimeout(() => {
          pauseRef.current = false;
        }, 4000);
      }
    }

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      clearTimeout(pauseTimerRef.current);
    };
  }, [count]);

  function dotClick(i: number) {
    pauseRef.current = true;
    clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      pauseRef.current = false;
    }, 4000);
    goTo(i);
  }

  return (
    <div className={className}>
      {/* Piste scrollable */}
      <div
        ref={containerRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto px-4"
      >
        {children}
      </div>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            onClick={() => dotClick(i)}
            aria-label={`Carte ${i + 1}`}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === active
                ? 'w-5 bg-brand-gold'
                : 'w-1.5 bg-brand-navy/25 hover:bg-brand-navy/40',
            )}
          />
        ))}
      </div>
    </div>
  );
}
