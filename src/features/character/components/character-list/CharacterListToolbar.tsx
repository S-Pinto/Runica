import { MagnifyingGlassIcon } from '../../../../components/ui/icons';

interface CharacterListToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  campaignOptions: { value: string; label: string }[];
  selectedCampaignFilter: string;
  onCampaignFilterChange: (value: string) => void;
}

/** Ricerca per testo e filtro per campagna. */
export const CharacterListToolbar = ({
  searchQuery, onSearchChange, campaignOptions, selectedCampaignFilter, onCampaignFilterChange,
}: CharacterListToolbarProps) => {
  const filterChips: { value: string; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    ...campaignOptions,
    { value: 'none', label: 'Senza campagna' },
  ];

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="relative md:w-80">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          aria-label="Cerca personaggi"
          placeholder="Cerca per nome, classe o razza"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>
      {campaignOptions.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Filtra per campagna">
          {filterChips.map((chip) => {
            const active = selectedCampaignFilter === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                aria-pressed={active}
                onClick={() => onCampaignFilterChange(chip.value)}
                className={`h-8 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border text-muted-foreground hover:border-accent/50 hover:text-text'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
