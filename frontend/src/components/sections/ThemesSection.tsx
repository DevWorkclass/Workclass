import { ArrowRight, Briefcase, Globe, Lightbulb, Rocket, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { THEMES, type Theme } from '@/data/homepageContent';

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

export function ThemesSection() {
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

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {THEMES.map((t, i) => {
            const Icon = ICONS[t.icon];
            const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
            return (
              <article
                key={t.title}
                className="group relative overflow-hidden rounded-2xl shadow-sm"
              >
                {/* Image-like gradient background */}
                <div className={`aspect-[3/4] bg-gradient-to-br ${gradient}`}>
                  {/* Icon subtil en fond */}
                  <div className="flex h-full items-center justify-center opacity-10">
                    <Icon className="size-24 text-white" />
                  </div>
                </div>

                {/* Overlay dégradé + contenu */}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5">
                  <span className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-gold">
                    Module {String(i + 1).padStart(2, '0')}
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
          })}
        </div>
      </div>
    </section>
  );
}
