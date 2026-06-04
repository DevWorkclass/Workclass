/**
 * Bandeau « Partenaire officiel du Summit ».
 */
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function PartnerBanner() {
  return (
    <section className="container py-10">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-brand-gold/30 bg-gradient-to-r from-brand-gold/15 to-transparent p-6 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-brand-navy">Partenaire officiel du Summit 2026</h3>
          <p className="mt-1 text-sm text-brand-muted">
            Associez votre marque à l’élite professionnelle du Gabon.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="#">Devenir partenaire</Link>
        </Button>
      </div>
    </section>
  );
}
