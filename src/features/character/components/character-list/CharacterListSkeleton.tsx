/** Segnaposto della lista: stessa forma delle schede (righe su telefono, card da `sm`). */
export const CharacterListSkeleton = () => (
  <div className="mx-auto max-w-7xl space-y-6 p-4 sm:px-6 sm:py-8" aria-busy="true" aria-label="Caricamento personaggi">
    <div className="h-14 w-56 animate-pulse rounded-xl bg-muted/40" />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 surface p-2.5 sm:flex-col sm:gap-0 sm:p-0">
          <div className="h-[5.5rem] w-[5.5rem] shrink-0 animate-pulse rounded-xl bg-muted/40 sm:aspect-[16/10] sm:h-auto sm:w-full sm:rounded-b-none" />
          <div className="flex flex-1 flex-col justify-between gap-3 py-1 sm:p-4">
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted/50" />
            <div className="h-2 animate-pulse rounded bg-muted/50" />
            <div className="hidden h-10 animate-pulse rounded-xl bg-muted/40 sm:block" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
