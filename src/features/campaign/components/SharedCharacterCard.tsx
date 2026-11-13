import type { ISharedCharacter } from '../../character/characterTypes';
import { ShieldOutlineIcon } from '../../../components/ui/icons';
import { hpBarTone, hpPercent, initials } from '../../character/utils/characterDisplay';

interface SharedCharacterCardProps {
    character: ISharedCharacter;
    /** Nome del giocatore a cui appartiene il personaggio. */
    ownerName?: string;
    isMine: boolean;
}

/**
 * Riepilogo di un personaggio condiviso: solo i dati che il proprietario pubblica.
 * Stessa forma della scheda nella lista (riga su telefono, card da `sm`), senza azioni.
 */
export const SharedCharacterCard = ({ character, ownerName, isMine }: SharedCharacterCardProps) => {
    const percent = hpPercent(character.hpCurrent, character.hpMax);
    const subtitle = [character.race, character.class].filter(Boolean).join(' · ') || 'Avventuriero';

    return (
        <li className="flex gap-3 surface p-2.5 sm:flex-col sm:gap-0 sm:p-0">
            <div className="relative h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-input sm:aspect-[16/10] sm:h-auto sm:w-full sm:rounded-b-none sm:rounded-t-[15px]">
                {character.portraitUrl ? (
                    <img src={character.portraitUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <span className="font-cinzel text-3xl font-bold text-accent/60 sm:text-5xl">{initials(character.name)}</span>
                    </div>
                )}
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-background/85 px-1.5 py-0.5 font-mono text-xs font-bold text-foreground sm:bottom-auto sm:left-3 sm:top-3 sm:rounded-full sm:px-2.5">
                    Lv {character.level}
                </span>
                {isMine && (
                    <span className="absolute right-3 top-3 hidden rounded-full bg-background/85 px-2.5 py-0.5 text-xs font-medium text-text sm:block">
                        Tuo
                    </span>
                )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:gap-3 sm:p-4">
                <div className="min-w-0">
                    <h3 className="truncate font-cinzel text-lg font-bold leading-snug text-foreground">{character.name || 'Senza nome'}</h3>
                    <p className="truncate text-sm capitalize text-muted-foreground">{subtitle}</p>
                    {(ownerName || isMine) && (
                        <p className="truncate text-xs text-muted-foreground">
                            {ownerName ? `di ${ownerName}` : ''}
                            {isMine && <span className="sm:hidden">{ownerName ? ' · ' : ''}tuo</span>}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-baseline justify-between gap-2">
                            <span className="text-label uppercase text-muted-foreground">
                                <span className="sm:hidden">PV</span>
                                <span className="hidden sm:inline">Punti vita</span>
                            </span>
                            <span className="font-mono text-sm font-bold text-foreground">
                                {character.hpCurrent}
                                <span className="font-normal text-muted-foreground">/{character.hpMax}</span>
                                {character.hpTemp > 0 && <span className="ml-1 text-accent">+{character.hpTemp}</span>}
                            </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-input" role="progressbar"
                            aria-label="Punti vita" aria-valuemin={0} aria-valuemax={character.hpMax} aria-valuenow={character.hpCurrent}>
                            <div className={`h-full rounded-full transition-[width] duration-500 ease-soft ${hpBarTone(percent)}`} style={{ width: `${percent}%` }} />
                        </div>
                    </div>
                    <div className="relative flex h-10 w-9 shrink-0 items-center justify-center" title="Classe Armatura">
                        <ShieldOutlineIcon aria-hidden className="absolute inset-0 h-full w-full text-border-strong" />
                        <span className="relative font-mono text-sm font-bold text-foreground">
                            <span className="sr-only">Classe Armatura </span>
                            {character.armorClass}
                        </span>
                    </div>
                </div>
            </div>
        </li>
    );
};
