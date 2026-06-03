/**
 * Bande de 3 atouts (billet électronique / scan / certificat).
 */
import { Award, ScanLine, Ticket } from 'lucide-react';

import { FEATURES, type Feature } from '@/data/homepageContent';

const ICONS: Record<Feature['icon'], typeof Ticket> = {
  ticket: Ticket,
  scan: ScanLine,
  award: Award,
};

export function FeatureStrip() {
  return (
    <section className="border-y border-brand-navy/10 bg-white/40">
      <div className="container grid gap-8 py-10 sm:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = ICONS[f.icon];
          return (
            <div key={f.title} className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold text-brand-navy">{f.title}</h3>
                <p className="mt-1 text-sm text-brand-muted">{f.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
