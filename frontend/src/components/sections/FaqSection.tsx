/**
 * FAQ — accordéon natif (<details>) sur 2 colonnes, accessible sans JS.
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
              className="group rounded-xl border border-brand-navy/10 bg-white px-4 py-3 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-brand-navy">
                {item.question}
                <Plus className="size-4 shrink-0 text-brand-gold transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
