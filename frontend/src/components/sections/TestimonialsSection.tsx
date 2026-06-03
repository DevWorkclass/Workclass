/**
 * Témoignages participants — 3 cartes avec note étoilée.
 */
import { Star } from 'lucide-react';

import { TESTIMONIALS } from '@/data/homepageContent';

export function TestimonialsSection() {
  return (
    <section className="container py-16">
      <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
        Témoignages
      </p>
      <h2 className="text-center text-3xl font-extrabold text-brand-navy">
        Ce que disent nos <span className="text-brand-gold">participants</span>
      </h2>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="flex flex-col rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm"
          >
            <div className="flex gap-0.5 text-brand-gold" aria-label={`${t.rating} sur 5`}>
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-brand-navy">
              « {t.quote} »
            </blockquote>
            <figcaption className="mt-4 border-t border-brand-navy/10 pt-4">
              <span className="block font-semibold text-brand-navy">{t.name}</span>
              <span className="text-sm text-brand-muted">{t.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
