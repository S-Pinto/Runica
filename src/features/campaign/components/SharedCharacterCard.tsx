import type { ISharedCharacter } from '../../character/characterTypes';
import { HeartIcon, ShieldIcon } from '../../../components/ui/icons';

const initials = (name: string) =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';

interface SharedCharacterCardProps {
    character: ISharedCharacter;
    /** Nome del giocatore a cui appartiene il personaggio. */
    ownerName?: string;
    isMine: boolean;
}

/** Riepilogo di un personaggio condiviso: solo i dati che il proprietario pubblica. */
export const SharedCharacterCard = ({ character, ownerName, isMine }: SharedCharacterCardProps) => {
    const hpPercent = character.hpMax > 0 ? Math.min(100, Math.max(0, (character.hpCurrent / character.hpMax) * 100)) : 100;
    const subtitle = [character.race, character.class].filter(Boolean).join(' · ') || 'Avventuriero';
    const hpTone = hpPercent <= 25 ? 'bg-destructive' : hpPercent <= 60 ? 'bg-warning' : 'bg-success';

    return (
        <li className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card">
            <div className="relative aspect-[16/10] overflow-hidden">
                {character.portraitUrl ? (
                    <img src={character.portraitUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgb(var(--color-accent)/0.28),transparent_60%),linear-gradient(160deg,rgb(var(--color-input)/0.6),rgb(var(--color-card)))]">
                        <span className="font-cinzel text-5xl font-bold text-accent/70">{initials(character.name)}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full border border-accent/40 bg-background/80 px-2.5 py-0.5 font-mono text-xs font-bold text-accent backdrop-blur">
                    Lv {character.level}
                </span>
                {isMine && (
                    <span className="absolute right-3 top-3 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-xs font-medium text-text backdrop-blur">
                        Tuo
                    </span>
                )}
            </div>
            <div className="space-y-3 p-4">
                <div className="min-w-0">
                    <h3 className="truncate font-cinzel text-lg font-bold text-foreground">{character.name || 'Senza nome'}</h3>
                    <p className="truncate text-xs capitalize text-muted-foreground">{subtitle}</p>
                    {ownerName && <p className="truncate text-xs text-muted-foreground">di {ownerName}</p>}
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 font-mono font-bold text-text" title="Classe armatura">
                        <ShieldIcon className="h-4 w-4 text-accent" /> {character.armorClass}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono font-bold text-text" title="Punti ferita">
                        <HeartIcon className="h-4 w-4 text-destructive" />
                        {character.hpCurrent}/{character.hpMax}
                        {character.hpTemp > 0 && <span className="text-xs text-accent">+{character.hpTemp}</span>}
                    </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-input" role="progressbar"
                    aria-label="Punti ferita" aria-valuemin={0} aria-valuemax={character.hpMax} aria-valuenow={character.hpCurrent}>
                    <div className={`h-full ${hpTone} transition-all`} style={{ width: `${hpPercent}%` }} />
                </div>
            </div>
        </li>
    );
};
