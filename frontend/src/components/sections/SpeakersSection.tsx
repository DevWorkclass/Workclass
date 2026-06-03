/**
 * Intervenants — « 24 leaders africains à votre écoute ».
 * 4 cartes en avant (initiales sur dégradé), lien vers la liste complète.
 */
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { SPEAKERS } from '@/data/homepageContent';

const GRADIENTS = [
  'from-brand-navy to-[#2152B6]',
  'from-[#3a1f5c] to-[#7c4dff]',
  'from-[#0f3d2e] to-[#24A775]',
  'from-[#4a2c1a] to-brand-gold',
];

export function SpeakersSection() {
  return (
    <section id="intervenants" className="container py-16">
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
        Intervenants
      </p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-3xl font-extrabold text-brand-navy">
          24 leaders <span className="text-brand-gold">africains</span> à votre écoute
        </h2>
        <Link
          href="#"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-gold"
        >
          Voir tous
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {SPEAKERS.map((s, i) => (
          <article
            key={s.initials}
            className="overflow-hidden rounded-2xl border border-brand-navy/10 bg-white shadow-sm"
          >
            <div
              className={`flex aspect-square items-center justify-center bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`}
            >
              <span className="text-5xl font-extrabold text-white/90">{s.initials}</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-brand-navy">{s.name}</h3>
              <p className="text-sm text-brand-muted">
                {s.role} · {s.company}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
