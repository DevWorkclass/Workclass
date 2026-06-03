/**
 * CTA final — bande marine, accroche + bouton de réservation.
 */
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function FinalCta() {
  return (
    <section className="container py-16">
      <div className="overflow-hidden rounded-3xl bg-brand-navy px-8 py-12 text-white sm:px-12">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold">
              Votre place vous attend.
              <br />
              <span className="text-brand-gold">Ne la laissez pas.</span>
            </h2>
            <p className="mt-3 max-w-md text-white/70">
              Réservez en quelques minutes et recevez votre billet électronique immédiatement.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="gold" size="lg">
              <Link href="/reservation">Réserver ma place</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="#chronogramme">Programme complet</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
