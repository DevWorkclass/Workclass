/**
 * Spinner accessible (aria-live, role=status).
 */
export function LoadingSpinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="inline-flex items-center gap-2">
      <span className="sr-only">{label}</span>
      <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
    </div>
  );
}
