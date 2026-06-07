'use client';

import { ArrowRight, Briefcase, Globe, Lightbulb, Rocket, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { MobileScrollCarousel } from '@/components/shared/MobileScrollCarousel';
import { THEMES, type Theme } from '@/data/homepageContent';
import { apiFetch } from '@/lib/api';

const ICONS: Record<Theme['icon'], typeof Briefcase> = {
  briefcase: Briefcase,
  'trending-up': TrendingUp,
  lightbulb: Lightbulb,
  rocket: Rocket,
  globe: Globe,
};

const CARD_GRADIENTS = [
  'from-[#0a2040] to-[#1d4ed8]',
  'from-[#1a0a30] to-[#6d28d9]',
  'from-[#0a2510] to-[#15803d]',
  'from-[#251500] to-[#b45309]',
];

function ThemeCard({ t, index }: { t: Theme; index: number }) {
  const Icon = ICONS[t.icon];
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  return (
    <article className="group relative overflow-hidden rounded-2xl shadow-sm">
      {t.imageUrl ? (
        <div
          className="aspect-[3/4] bg-cover bg-center"
          style={{ backgroundImage: `url(${t.imageUrl})` }}
          role="img"
          aria-label={t.title}
        />
      ) : (
        <div className={`aspect-[3/4] bg-gradient-to-br ${gradient}`}>
          <div className="flex h-full items-center justify-center opacity-10">
            <Icon className="size-24 text-white" />
          </div>
        </div>
      )}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5">
        <span className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-gold">
          Module {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="text-sm font-bold leading-snug text-white">
          {t.title.split(' · ').slice(-1)[0]}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-white/60">{t.description}</p>
        <Link
          href="#"
          className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-white/60 transition-colors group-hover:text-brand-gold"
        >
          Voir plus
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

export function ThemesSection() {
  // Domaines éditables depuis l'admin ; fallback sur les valeurs statiques.
  const [themes, setThemes] = useState<Theme[]>(THEMES);

  useEffect(() => {
    apiFetch<{ data: Theme[] }>('/content/home-themes')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) setThemes(res.data);
      })
      .catch(() => {
        /* fallback statique déjà en place */
      });
  }, []);

  return (
    <section className="bg-brand-cream py-16">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
              Programme
            </p>
            <h2 className="max-w-xl text-3xl font-extrabold text-brand-navy">
              Comprendre les enjeux du business{' '}
              <span className="text-brand-gold">africain</span>
            </h2>
          </div>
          <Link
            href="#chronogramme"
            className="flex items-center gap-1 text-sm font-semibold text-brand-navy/60 hover:text-brand-navy"
          >
            Voir le programme complet
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* ── Grille desktop (sm+) ── */}
        <div className="mt-10 hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {themes.map((t, i) => (
            <ThemeCard key={t.title} t={t} index={i} />
          ))}
        </div>
      </div>

      {/* ── Scroll manuel mobile (< sm) ── */}
      <MobileScrollCarousel count={themes.length} className="mt-8 sm:hidden">
        {themes.map((t, i) => (
          <div key={t.title} className="w-52 shrink-0 snap-start">
            <ThemeCard t={t} index={i} />
          </div>
        ))}
      </MobileScrollCarousel>
    </section>
  );
}
