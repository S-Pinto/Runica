import { ReactNode } from 'react';
import { BackIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { AstrolabeRing } from '../../../../components/ui/RuneOrnaments';

interface HeroHeaderProps {
    name: string;
    /** Riga sotto il nome (razza · classe · livello, oppure lo stato dell'editor). */
    subtitle?: ReactNode;
    imageUrl?: string;
    /** Se presente il ritratto diventa un pulsante (es. per ingrandirlo). */
    onPortraitClick?: () => void;
    /** Elemento sotto il sottotitolo (es. la campagna). */
    badge?: ReactNode;
    onBack: () => void;
    backLabel: string;
    /** Azioni a destra. */
    actions?: ReactNode;
    /** Variante dell'editor: ritratto da 48px, nome più piccolo, azioni sempre sulla stessa riga. */
    compact?: boolean;
}

const initialsOf = (name: string) =>
    (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

/**
 * Intestazione dell'eroe condivisa da vista di gioco ed editor: tessera con
 * `.hero-glow`, ritratto (o segnaposto inciso), nome in Norse e filigrana `AstrolabeRing`.
 */
export const HeroHeader = ({ name, subtitle, imageUrl, onPortraitClick, badge, onBack, backLabel, actions, compact = false }: HeroHeaderProps) => {
    const portraitSize = compact ? 'h-12 w-12' : 'h-14 w-14 sm:h-16 sm:w-16';
    const portrait = imageUrl ? (
        <img
            src={imageUrl}
            alt=""
            className={`${portraitSize} rounded-2xl object-cover ring-2 ring-accent/40 transition-shadow duration-150 ${onPortraitClick ? 'hover:ring-accent' : 'shrink-0'}`}
        />
    ) : (
        <div className={`portrait-rune monogram relative flex ${portraitSize} shrink-0 items-center justify-center rounded-2xl border border-border-strong/40 ${compact ? 'text-lg' : 'text-xl sm:text-2xl'}`}>
            {initialsOf(name)}
        </div>
    );

    return (
        <header className={`tile hero-glow relative z-20 ${compact ? 'p-3 sm:p-4' : 'p-3 sm:p-5'}`}>
            {/* Ritaglio solo per la filigrana: l'header resta senza overflow-hidden (focus ring e ombre dei tasti non vengono tagliati). */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <AstrolabeRing
                    className={compact
                        ? 'absolute -right-10 -top-20 h-56 w-56 text-accent/[0.14] sm:-right-4 sm:-top-24 sm:h-64 sm:w-64'
                        : 'absolute -right-16 -top-24 h-72 w-72 text-accent/[0.18] sm:-right-6 sm:-top-28 sm:h-80 sm:w-80'}
                />
                <span className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
            </div>
            <div className={`relative flex ${compact ? 'items-center gap-2 sm:gap-4' : 'flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'}`}>
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
                    <Button variant="ghost" size="icon-lg" onClick={onBack} aria-label={backLabel} className="-ml-1 sm:ml-0">
                        <BackIcon className="h-5 w-5" />
                    </Button>
                    {imageUrl && onPortraitClick ? (
                        <button
                            type="button"
                            onClick={onPortraitClick}
                            aria-label="Ingrandisci ritratto"
                            className="shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {portrait}
                        </button>
                    ) : portrait}
                    <div className="min-w-0">
                        <h1
                            className={compact
                                ? 'truncate font-norse text-xl font-black leading-tight tracking-tight text-foreground sm:text-2xl'
                                : 'line-clamp-2 break-words font-norse text-2xl font-black leading-none tracking-tight text-foreground sm:line-clamp-1 sm:text-4xl'}
                        >
                            {name || 'Senza nome'}
                        </h1>
                        {subtitle && (
                            compact
                                ? <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">{subtitle}</div>
                                : <p className="mt-0.5 line-clamp-2 text-sm capitalize text-muted-foreground sm:line-clamp-1">{subtitle}</p>
                        )}
                        {badge}
                    </div>
                </div>

                {actions && <div className="flex items-center gap-1 sm:gap-2">{actions}</div>}
            </div>
        </header>
    );
};
