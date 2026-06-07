/**
 * Admin — Événements. Liste + carte de gestion (données mock).
 */
import Link from 'next/link';
import { Badge } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';

export default function AdminEventsPage() {
  const booked = 227;
  const capacity = 500;
  const progress = Math.round((booked / capacity) * 100);

  return (
    <>
      <PageHeader
        title="Événements"
        subtitle="Créez et gérez vos événements"
        actions={
          <Link href="/admin/evenements/nouveau">
            <Button variant="gold" size="sm">
              + Créer un événement
            </Button>
          </Link>
        }
      />

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Carte événement */}
        <article className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="relative aspect-[16/7] bg-brand-navy-deep">
            <span className="absolute right-4 top-4">
              <Badge tone="success" dot>
                Actif & Inscriptions ouvertes
              </Badge>
            </span>
          </div>
          <div className="p-6">
            <h2 className="text-lg font-bold text-brand-navy">Work Class Summit 2026</h2>
            <p className="mt-1 text-sm text-brand-muted">
              15 &amp; 16 Juillet 2026 · Palais des Congrès de Libreville
            </p>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
              <span className="font-bold text-brand-navy">
                {booked} / {capacity}
              </span>
              <span className="font-bold text-brand-gold">8,4M FCFA</span>
              <span className="font-bold text-brand-navy">4,8/5</span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-cream">
              <div className="h-full rounded-full bg-brand-gold" style={{ width: `${progress}%` }} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                Modifier
              </Button>
              <Button variant="outline" size="sm">
                Voir la page
              </Button>
              <Button variant="outline" size="sm">
                Stats
              </Button>
              <Button variant="ghost" size="sm" className="text-semantic-error">
                Dépublier
              </Button>
            </div>
          </div>
        </article>

        {/* Créer un nouvel événement */}
        <Link
          href="/admin/evenements/nouveau"
          className="grid min-h-56 place-items-center rounded-2xl border-2 border-dashed border-black/10 bg-white/40 text-center transition-colors hover:border-brand-gold/50 hover:bg-white"
        >
          <span>
            <span className="mx-auto block text-3xl text-brand-muted">+</span>
            <span className="mt-2 block font-semibold text-brand-navy">
              Créer un nouvel événement
            </span>
            <span className="mt-1 block text-sm text-brand-muted">Cliquez pour commencer</span>
          </span>
        </Link>
      </section>
    </>
  );
}
