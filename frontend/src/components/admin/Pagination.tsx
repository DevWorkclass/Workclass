/**
 * Pagination simple (Précédent / Suivant + indicateur). Masquée si une seule page.
 */
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onChange }: Readonly<PaginationProps>) {
  if (pageCount <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Précédent
      </Button>
      <span className="text-sm text-brand-muted">
        Page {page} / {pageCount}
      </span>
      <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        Suivant
      </Button>
    </div>
  );
}

/** Découpe une liste pour la page courante. */
export function paginate<T>(items: T[], page: number, size: number): T[] {
  const start = (page - 1) * size;
  return items.slice(start, start + size);
}
