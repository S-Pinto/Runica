import { MagnifyingGlassIcon } from '../../../../components/ui/icons';
import { fieldInputClass } from '../../../../components/ui/field';

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
          className={`${fieldInputClass} bg-card pl-10`}
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
                className={`h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-xs font-semibold transition-colors duration-150 ${
                  active
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border-strong/50 text-muted-foreground hover:border-border-strong hover:text-foreground'
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
