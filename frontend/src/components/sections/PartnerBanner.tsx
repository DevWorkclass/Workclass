/**
 * Bandeau « Avec le soutien de WILA » + partenaires institutionnels.
 * Contenu : OnePager LOGWILA (« Together we are stronger »).
 */
import { PARTNERS } from '@/data/homepageContent';

export function PartnerBanner() {
  return (
    <section className="container py-10">
      <div className="rounded-2xl border border-brand-gold/30 bg-gradient-to-r from-brand-gold/15 to-transparent p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-brand-navy">
              Avec le soutien de WILA — Women In Logistics Africa Gabon
            </h3>
            <p className="mt-1 text-sm italic text-brand-muted">« Together we are stronger »</p>
          </div>
          <p className="text-sm text-brand-muted">
            Porté par 2NY Consulting &amp; EC DOUANE · IDELO
          </p>
        </div>

        <ul className="mt-5 flex flex-wrap gap-2">
          {PARTNERS.map((p) => (
            <li
              key={p.name}
              title={p.description}
              className="rounded-full border border-brand-navy/10 bg-white px-3 py-1.5 text-xs font-semibold text-brand-navy"
            >
              {p.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
