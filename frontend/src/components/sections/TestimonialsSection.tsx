import { Star } from 'lucide-react';

import { TESTIMONIALS } from '@/data/homepageContent';

export function TestimonialsSection() {
  return (
    <section className="bg-brand-navy py-16 text-white">
      <div className="container">
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
          Témoignages
        </p>
        <h2 className="text-center text-3xl font-extrabold">
          Ce que disent nos{' '}
          <span className="text-brand-gold">participants</span>
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="size-4 fill-brand-gold text-brand-gold" />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-white/70">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="font-semibold text-white">{t.name}</p>
                <p className="text-xs text-white/45">{t.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
