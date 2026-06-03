/**
 * Thématiques 2026 — 4 cartes avec visuel + titre + lien.
 */
import { ArrowRight, Briefcase, Lightbulb, Rocket, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { THEMES, type Theme } from '@/data/homepageContent';

const ICONS: Record<Theme['icon'], typeof Briefcase> = {
  briefcase: Briefcase,
  'trending-up': TrendingUp,
  lightbulb: Lightbulb,
  rocket: Rocket,
};

export function ThemesSection() {
  return (
    <section className="container py-16">
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
        Thématiques 2026
      </p>
      <h2 className="max-w-2xl text-3xl font-extrabold text-brand-navy">
        Comprendre les enjeux du business <span className="text-brand-gold">africain</span>
      </h2>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {THEMES.map((t) => {
          const Icon = ICONS[t.icon];
          return (
            <article
              key={t.title}
              className="group flex flex-col overflow-hidden rounded-2xl border border-brand-navy/10 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-brand-navy/80 text-brand-gold">
                <Icon className="size-10" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-semibold text-brand-navy">{t.title}</h3>
                <p className="mt-2 flex-1 text-sm text-brand-muted">{t.description}</p>
                <Link
                  href="#"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-brand-gold"
                >
                  Explorer
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
