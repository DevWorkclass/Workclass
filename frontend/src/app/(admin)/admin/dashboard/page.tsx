/**
 * Tableau de bord admin — vue d'ensemble temps réel (données mock).
 */
import { Badge } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { ADMIN_BOOKINGS, ADMIN_DASHBOARD } from '@/data/adminMockData';
import { formatAmount } from '@/lib/formatters';

const WEEKS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
const WEEK_VALUES = [18, 24, 31, 27, 22, 5];

export default function AdminDashboardPage() {
  const { ticketSplit } = ADMIN_DASHBOARD;
  const { standard, vip, available, total } = ticketSplit;
  const seatsTotal = standard + vip + available;
  const stdEnd = (standard / seatsTotal) * 100;
  const vipEnd = ((standard + vip) / seatsTotal) * 100;
  const maxWeek = Math.max(...WEEK_VALUES);

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle="Work Class Summit 2026 · Vue temps réel"
        actions={
          <>
            <Button variant="outline" size="sm">
              Exporter PDF
            </Button>
            <Button variant="gold" size="sm">
              Inscription manuelle
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Réservations totales"
          value={ADMIN_DASHBOARD.totalBookings}
          hint={`↑ ${ADMIN_DASHBOARD.bookingsDelta}`}
          accent="gold"
        />
        <StatCard
          label="Revenus générés (FCFA)"
          value={ADMIN_DASHBOARD.revenue}
          hint={`↑ ${ADMIN_DASHBOARD.revenueDelta}`}
          accent="green"
        />
        <StatCard
          label="Places restantes"
          value={ADMIN_DASHBOARD.seatsRemaining}
          hint={`sur ${ADMIN_DASHBOARD.seatsTotal} au total`}
          accent="blue"
        />
        <StatCard
          label="Note moyenne 2025"
          value={ADMIN_DASHBOARD.avgRating}
          hint={`↑ ${ADMIN_DASHBOARD.reviewsCount} avis collectés`}
          accent="red"
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-navy">Réservations par semaine</h2>
          <p className="text-sm text-brand-muted">6 dernières semaines — Summit 2026</p>
          <div className="mt-6 flex h-40 items-end justify-between gap-3">
            {WEEKS.map((week, i) => (
              <div key={week} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-brand-gold/80"
                  style={{ height: `${((WEEK_VALUES[i] ?? 0) / maxWeek) * 100}%` }}
                />
                <span className="text-xs text-brand-muted">{week}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-navy">Répartition des billets</h2>
          <p className="text-sm text-brand-muted">Standard vs VIP Premium</p>
          <div className="mt-6 flex items-center gap-8">
            <div
              className="relative grid size-32 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#C8A84B 0 ${stdEnd}%, #3B82F6 ${stdEnd}% ${vipEnd}%, #E5E7EB ${vipEnd}% 100%)`,
              }}
            >
              <div className="grid size-20 place-items-center rounded-full bg-white text-xl font-extrabold text-brand-navy">
                {total}
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-brand-gold" />
                Standard
                <span className="ml-auto font-bold text-brand-navy">{standard}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-semantic-info" />
                VIP Premium
                <span className="ml-auto font-bold text-brand-navy">{vip}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-gray-200" />
                Disponibles
                <span className="ml-auto font-bold text-brand-navy">{available}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-brand-navy">Dernières réservations</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-brand-muted">
                <th className="pb-3 font-semibold">Participant</th>
                <th className="pb-3 font-semibold">Billet</th>
                <th className="pb-3 font-semibold">Montant</th>
                <th className="pb-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_BOOKINGS.map((b) => (
                <tr key={b.reference} className="border-t border-black/5">
                  <td className="py-3">
                    <p className="font-semibold text-brand-navy">{b.participant}</p>
                    <p className="text-xs text-brand-muted">{b.date}</p>
                  </td>
                  <td className="py-3 text-brand-navy">{b.ticket}</td>
                  <td className="py-3 font-semibold text-brand-gold">{formatAmount(b.amount)}</td>
                  <td className="py-3">
                    {b.status === 'confirmed' ? (
                      <Badge tone="success" dot>
                        Confirmé
                      </Badge>
                    ) : (
                      <Badge tone="warning" dot>
                        En attente
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
