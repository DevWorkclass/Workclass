/**
 * État vide standard (listes sans résultat).
 */
export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
    </div>
  );
}
