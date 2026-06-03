/**
 * Chronogramme du Summit — timeline horizontale (scroll mobile) des étapes clés.
 */
import { Check } from 'lucide-react';

import { CHRONO_STEPS, type ChronoStep } from '@/data/homepageContent';
import { cn } from '@/lib/utils';

const DOT: Record<ChronoStep['status'], string> = {
  done: 'bg-brand-gold text-brand-navy border-brand-gold',
  current: 'bg-white text-brand-navy border-brand-gold ring-4 ring-brand-gold/20',
  upcoming: 'bg-white text-brand-muted border-brand-navy/20',
};

export function ChronogrammeSection() {
  return (
    <section id="chronogramme" className="border-y border-brand-navy/10 bg-white/40 py-16">
      <div className="container">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
          Calendrier &amp; échéances
        </p>
        <h2 className="text-3xl font-extrabold text-brand-navy">
          Chronogramme du <span className="text-brand-gold">Summit 2026</span>
        </h2>

        {/* Timeline */}
        <ol className="mt-12 flex gap-6 overflow-x-auto pb-4 lg:grid lg:grid-cols-8 lg:gap-2 lg:overflow-visible">
          {CHRONO_STEPS.map((step, i) => (
            <li key={step.title} className="relative flex w-40 shrink-0 flex-col items-center lg:w-auto">
              {/* ligne */}
              {i < CHRONO_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-1/2 top-4 hidden h-px w-full bg-brand-navy/15 lg:block"
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex size-8 items-center justify-center rounded-full border text-xs font-bold',
                  DOT[step.status],
                )}
              >
                {step.status === 'done' ? <Check className="size-4" /> : i + 1}
              </span>
              <span className="mt-3 text-center text-xs font-medium text-brand-navy">
                {step.title}
              </span>
              <span className="mt-1 text-center text-[0.7rem] text-brand-muted">{step.date}</span>
              <span className="mt-2 rounded-full bg-brand-navy/5 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-brand-muted">
                {step.phase}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
