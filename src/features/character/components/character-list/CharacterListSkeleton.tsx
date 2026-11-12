export const CharacterListSkeleton = () => (
  <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8" aria-busy="true" aria-label="Caricamento personaggi">
    <div className="h-16 w-64 animate-pulse rounded-xl bg-muted/30" />
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border/50 bg-card">
          <div className="aspect-[4/3] animate-pulse bg-muted/30" />
          <div className="space-y-3 p-4">
            <div className="h-2 animate-pulse rounded bg-muted/40" />
            <div className="h-10 animate-pulse rounded-xl bg-muted/30" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
