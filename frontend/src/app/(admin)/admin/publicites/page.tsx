/**
 * Admin — Publicités & Annonces (carrousel page d'accueil). Données mock.
 */
import { Badge } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { ADMIN_ADS } from '@/data/adminMockData';

export default function AdminAdsPage() {
  const active = ADMIN_ADS.filter((a) => a.active);

  return (
    <>
      <PageHeader
        title="Publicités & Annonces"
        subtitle="Gérez le carrousel publicitaire de la plateforme"
        actions={
          <Button variant="gold" size="sm">
            + Ajouter une annonce
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-brand-navy">Annonces actives ({active.length})</h2>
        <p className="text-sm text-brand-muted">
          Ces annonces s&apos;affichent dans le carrousel de la page d&apos;accueil
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ADMIN_ADS.map((ad) => (
          <li
            key={ad.id}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="aspect-[16/9] rounded-xl bg-brand-navy-deep/90" aria-hidden />
            <div className="mt-4 flex items-start justify-between gap-3">
              <p className="font-semibold text-brand-navy">{ad.title}</p>
              {ad.active ? (
                <Badge tone="success" dot>
                  Active
                </Badge>
              ) : (
                <Badge tone="neutral">Inactive</Badge>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm">
                Modifier
              </Button>
              <Button variant="ghost" size="sm" className="text-semantic-error">
                Retirer
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
