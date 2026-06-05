import Link from 'next/link';

import { PageHeader } from '@/components/admin/PageHeader';
import { RecentBookingsTable } from '@/components/admin/RecentBookingsTable';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { ADMIN_ACTIVITY, ADMIN_BOOKINGS, ADMIN_DASHBOARD } from '@/data/adminMockData';
import type { ActivityColor } from '@/data/adminMockData';
import { cn } from '@/lib/utils';

const WEEKS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
const WEEK_VALUES = [18, 24, 31, 27, 22, 5];

const ACTIVITY_BG: Record<ActivityColor, string> = {
  navy: 'bg-brand-navy',
  success: 'bg-semantic-success',
  purple: 'bg-purple-500',
  warning: 'bg-semantic-warning',
};

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
              + Inscription manuelle
            </Button>
          </>
        }
      />

      {/* KPI cards */}
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

      {/* Charts */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Bar chart */}
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

        {/* Donut chart */}
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-navy">Répartition des billets</h2>
          <p className="text-sm text-brand-muted">Standard vs VIP Premium</p>
          <div className="mt-6 flex items-center gap-8">
            <div
              className="relative grid size-32 shrink-0 place-items-center rounded-full"
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
                <span className="text-brand-muted">Standard</span>
                <span className="ml-auto font-bold text-brand-navy">{standard}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-semantic-info" />
                <span className="text-brand-muted">VIP Premium</span>
                <span className="ml-auto font-bold text-brand-navy">{vip}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-gray-200" />
                <span className="text-brand-muted">Disponibles</span>
                <span className="ml-auto font-bold text-brand-navy">{available}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Recent bookings + Activity feed */}
      <section className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Table — 3 / 5 cols */}
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:col-span-3">
          <RecentBookingsTable bookings={ADMIN_BOOKINGS} />
        </div>

        {/* Activity feed — 2 / 5 cols */}
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-brand-navy">Activité récente</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-semantic-success/10 px-2.5 py-0.5 text-xs font-semibold text-semantic-success">
              <span className="size-1.5 animate-pulse rounded-full bg-semantic-success" aria-hidden />
              Live
            </span>
          </div>

          <ul className="space-y-4">
            {ADMIN_ACTIVITY.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                    ACTIVITY_BG[item.color],
                  )}
                  aria-hidden
                >
                  {item.initial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-navy">{item.title}</p>
                  <p className="truncate text-xs text-brand-muted">{item.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-brand-muted">{item.ago}</span>
              </li>
            ))}
          </ul>

          <Link
            href={ROUTES.admin.bookings}
            className="mt-5 block text-center text-xs font-semibold text-brand-gold hover:underline"
          >
            Voir tout →
          </Link>
        </div>
      </section>

      {/* Chronogramme */}
      <section className="mt-6">
        <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white px-6 py-4 shadow-sm">
          <h2 className="font-bold text-brand-navy">Chronogramme – Vue d'ensemble</h2>
          <Link
            href={ROUTES.admin.events}
            className="text-sm font-semibold text-brand-gold hover:underline"
          >
            Voir détail →
          </Link>
        </div>
      </section>
    </>
  );
}
