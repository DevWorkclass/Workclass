/**
 * Graphe en barres horizontales — réutilisé pour les répartitions
 * (participants/événement, budget/événement, types de participants).
 */

interface BarListProps {
  title: string;
  subtitle: string;
  items: { label: string; value: number }[];
  format?: (v: number) => string;
}

export function BarList({ title, subtitle, items, format }: BarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="font-bold text-brand-navy">{title}</h2>
      <p className="text-sm text-brand-muted">{subtitle}</p>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-brand-muted">Aucune donnée pour le moment.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((i) => (
            <li key={i.label} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="truncate text-brand-navy">{i.label}</span>
                <span className="ml-2 shrink-0 font-bold text-brand-navy">
                  {format ? format(i.value) : i.value}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-brand-gold/80"
                  style={{ width: `${(i.value / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
