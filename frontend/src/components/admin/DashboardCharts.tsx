'use client';

/**
 * Composants de visualisation pour le tableau de bord admin (Recharts).
 * Toutes les données viennent de GET /admin/metrics/kpi.
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { KpiSnapshot } from '@/lib/kpi';
import { formatPrice } from '@/lib/formatters';

const COLORS = {
  navy: '#0D2145',
  gold: '#C8A84B',
  green: '#16a34a',
  red: '#dc2626',
  blue: '#2563eb',
  orange: '#ea580c',
  purple: '#7c3aed',
  muted: '#9ca3af',
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: COLORS.green,
  pending: COLORS.gold,
  cancelled: COLORS.red,
  refunded: COLORS.muted,
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmées',
  pending: 'En attente',
  cancelled: 'Annulées',
  refunded: 'Remboursées',
};

/** Carte de chart générique avec titre et padding adapté mobile. */
function ChartCard({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle?: string; children: React.ReactNode }>) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm sm:p-5">
      <header className="mb-3 sm:mb-4">
        <h3 className="text-sm font-bold text-brand-navy sm:text-base">{title}</h3>
        {subtitle && <p className="text-[11px] text-brand-muted sm:text-xs">{subtitle}</p>}
      </header>
      <div className="h-56 w-full sm:h-[280px]">{children}</div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Courbe : réservations / jour (30 derniers jours)
// ─────────────────────────────────────────────────────────
export function BookingsTrend({ data }: Readonly<{ data: KpiSnapshot['daily'] }>) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
  }));
  return (
    <ChartCard
      title="Réservations — 30 derniers jours"
      subtitle="Évolution journalière (annulées exclues)"
    >
      <ResponsiveContainer>
        <AreaChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.gold} stopOpacity={0.4} />
              <stop offset="95%" stopColor={COLORS.gold} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={4} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            labelStyle={{ color: COLORS.navy, fontWeight: 700 }}
          />
          <Area
            type="monotone"
            dataKey="bookings"
            name="Réservations"
            stroke={COLORS.gold}
            strokeWidth={2}
            fill="url(#bookGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─────────────────────────────────────────────────────────
// Courbe : revenus cumulés (30 derniers jours)
// ─────────────────────────────────────────────────────────
export function RevenueTrend({ data }: Readonly<{ data: KpiSnapshot['daily'] }>) {
  let cum = 0;
  const formatted = data.map((d) => {
    cum += d.revenue;
    return {
      label: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      revenue: d.revenue,
      cumul: cum,
    };
  });
  return (
    <ChartCard title="Revenus — 30 derniers jours" subtitle="Quotidien et cumul">
      <ResponsiveContainer>
        <LineChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={4} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            formatter={(v) => formatPrice(Number(v))}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Quotidien"
            stroke={COLORS.blue}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="cumul"
            name="Cumul"
            stroke={COLORS.green}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─────────────────────────────────────────────────────────
// Donut : statuts des réservations
// ─────────────────────────────────────────────────────────
export function BookingsStatusDonut({ data }: Readonly<{ data: KpiSnapshot['bookingsByStatus'] }>) {
  const items = data.map((d) => ({
    name: STATUS_LABELS[d.status] ?? d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] ?? COLORS.muted,
  }));
  const empty = items.every((i) => i.value === 0);
  return (
    <ChartCard title="Statut des réservations" subtitle="Répartition globale">
      {empty ? (
        <div className="grid h-full place-items-center text-sm text-brand-muted">
          Aucune réservation.
        </div>
      ) : (
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={items}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
            >
              {items.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ─────────────────────────────────────────────────────────
// Barres horizontales : top événements par participants
// ─────────────────────────────────────────────────────────
export function TopEvents({ data }: Readonly<{ data: KpiSnapshot['participantsByEvent'] }>) {
  const sorted = [...data]
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 5)
    .map((d) => ({
      ...d,
      event: d.event.length > 24 ? `${d.event.slice(0, 22)}…` : d.event,
    }));
  return (
    <ChartCard title="Top événements" subtitle="Par nombre de participants">
      {sorted.length === 0 ? (
        <div className="grid h-full place-items-center text-sm text-brand-muted">
          Aucune réservation.
        </div>
      ) : (
        <ResponsiveContainer>
          <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="event"
              tick={{ fontSize: 11 }}
              width={130}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Bar dataKey="participants" fill={COLORS.navy} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ─────────────────────────────────────────────────────────
// Donut : répartition par type de billet
// ─────────────────────────────────────────────────────────
export function TicketTypeSplit({ data }: Readonly<{ data: KpiSnapshot['participantsByType'] }>) {
  const palette = [COLORS.gold, COLORS.navy, COLORS.green, COLORS.purple, COLORS.orange, COLORS.blue];
  const items = data
    .filter((d) => d.participants > 0)
    .map((d, i) => ({ name: d.type, value: d.participants, color: palette[i % palette.length] }));
  return (
    <ChartCard title="Types de billets" subtitle="Répartition des places vendues">
      {items.length === 0 ? (
        <div className="grid h-full place-items-center text-sm text-brand-muted">
          Aucune vente enregistrée.
        </div>
      ) : (
        <ResponsiveContainer>
          <PieChart>
            <Pie data={items} dataKey="value" nameKey="name" outerRadius={95} paddingAngle={2}>
              {items.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ─────────────────────────────────────────────────────────
// Histogramme : distribution des notes (1 à 5 étoiles)
// ─────────────────────────────────────────────────────────
export function RatingsHistogram({
  data,
}: Readonly<{ data: KpiSnapshot['ratingsDistribution'] }>) {
  const formatted = data.map((d) => ({ label: `${d.rating} ★`, count: d.count }));
  const empty = formatted.every((d) => d.count === 0);
  return (
    <ChartCard title="Distribution des notes" subtitle="Avis approuvés, tous critères confondus">
      {empty ? (
        <div className="grid h-full place-items-center text-sm text-brand-muted">
          Aucun avis approuvé.
        </div>
      ) : (
        <ResponsiveContainer>
          <BarChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Bar dataKey="count" name="Notes" fill={COLORS.gold} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ─────────────────────────────────────────────────────────
// Jauges : taux de complétion (présence, paiement, certificats)
// ─────────────────────────────────────────────────────────
export function CompletionGauges({ data }: Readonly<{ data: KpiSnapshot['gauges'] }>) {
  const items = [
    { label: 'Paiements', value: data.paymentRate, hint: 'Confirmés / réservations' },
    { label: 'Présences', value: data.scanRate, hint: 'Scannés / places vendues' },
    { label: 'Certificats', value: data.certificateRate, hint: 'Envoyés / billets émis' },
  ];
  return (
    <section className="grid gap-3 grid-cols-1 sm:grid-cols-3">
      {items.map((g) => {
        const pct = Math.min(Math.max(g.value, 0), 100);
        return (
          <div
            key={g.label}
            className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className="relative grid size-16 shrink-0 place-items-center rounded-full sm:size-20"
                style={{ background: `conic-gradient(${COLORS.gold} ${pct}%, #E5E7EB ${pct}% 100%)` }}
                role="img"
                aria-label={`${g.label} : ${g.value}%`}
              >
                <div className="grid size-11 place-items-center rounded-full bg-white text-sm font-extrabold text-brand-navy sm:size-14 sm:text-base">
                  {g.value}%
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-brand-navy sm:text-base">
                  {g.label}
                </h3>
                <p className="mt-0.5 break-words text-[11px] leading-tight text-brand-muted sm:text-xs">
                  {g.hint}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
