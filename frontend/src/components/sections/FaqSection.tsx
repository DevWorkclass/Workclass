/**
 * FAQ — accordéon natif (<details>) sur 2 colonnes, accessible sans JS.
 * La zone cliquable (<summary>) couvre toute la carte (padding inclus) pour
 * faciliter le tap sur mobile (cible >= 44 px de haut).
 */
import { Plus } from 'lucide-react';

import { FAQ_ITEMS } from '@/data/homepageContent';

export function FaqSection() {
  return (
    <section id="faq" className="border-t border-brand-navy/10 bg-white/40 py-16">
      <div className="container">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
          FAQ
        </p>
        <h2 className="text-center text-3xl font-extrabold text-brand-navy">
          Questions <span className="text-brand-gold">fréquentes</span>
        </h2>

        <div className="mx-auto mt-10 grid max-w-4xl gap-3 md:grid-cols-2">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group overflow-hidden rounded-xl border border-brand-navy/10 bg-white transition-shadow hover:shadow-sm [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex min-h-[52px] w-full cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-brand-navy hover:bg-brand-cream/40 active:bg-brand-cream/60">
                <span className="flex-1">{item.question}</span>
                <Plus
                  className="size-5 shrink-0 text-brand-gold transition-transform group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <p className="px-4 pb-4 text-sm leading-relaxed text-brand-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
