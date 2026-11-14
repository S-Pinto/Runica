import type { ReactNode } from 'react';
import type { IDmAction, ILiveStats, ISharedCharacter } from '../../character/characterTypes';
import { PlaySection, playChipClass } from '../../character/components/play-view/PlaySection';
import { HpBar } from '../../character/components/play-view/HpBar';
import { BentoStat } from '../../character/components/ui/BentoStat';
import { InspirationIcon, ShieldIcon, ForwardIcon, SparklesIcon, SkullIcon, HeartIcon, CheckIcon } from '../../../components/ui/icons';
import { conditionLabel, DM_ACTION_LABELS } from '../../../lib/labels';
import { describeAgo, isStale, narrativeVitals } from '../../character/rules/campaign';
import { initials } from '../../character/utils/characterDisplay';
import { SpellSlotPips } from './SpellSlotPips';
import { PassiveScoresRow } from './PassiveScoresRow';
import { VitalsBadge, VitalsBar } from './VitalsBadge';

interface PartyMemberTileProps {
    character: ISharedCharacter;
    /** Numeri dal vivo: assenti in modalità narrativa (per i compagni) o prima della prima pubblicazione. */
    live?: ILiveStats;
    ownerName?: string;
    isMine?: boolean;
    /** `full` = Live Board del DM (CA, velocità, CD, passive, slot); `compact` = Party Hub (PF, CA, condizioni). */
    variant?: 'full' | 'compact';
    /** Azioni del DM ancora da applicare per questo personaggio (solo DM). */
    pending?: IDmAction[];
    now: number;
    /** Apre il dettaglio (DM). */
    onOpen?: () => void;
    /** Concede o revoca l'Ispirazione Eroica (DM). */
    onToggleInspiration?: () => void;
    /** Contenuto in fondo (es. "Apri la tua scheda"). */
    footer?: ReactNode;
}

const Portrait = ({ character }: { character: ISharedCharacter }) =>
    character.portraitUrl ? (
        <img src={character.portraitUrl} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
    ) : (
        <span aria-hidden className="portrait-rune monogram flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg">
            {initials(character.name)}
        </span>
    );

/**
 * Tessera di un membro del gruppo al tavolo. Con `live` mostra i numeri (PF con barra, CA, ecc.);
 * senza, solo lo stato narrativo (Sano / Ferito / Critico / A terra), condizioni e ispirazione:
 * in modalità narrativa i numeri dei compagni non sono nemmeno nel DOM.
 */
export const PartyMemberTile = ({
    character, live, ownerName, isMine, variant = 'compact', pending = [], now, onOpen, onToggleInspiration, footer,
}: PartyMemberTileProps) => {
    const inspired = live?.heroicInspiration ?? character.heroicInspiration ?? false;
    const conditions = live?.conditions ?? character.conditions ?? [];
    const vitals = live ? narrativeVitals(live.hp.current, live.hp.max) : character.vitals ?? 'healthy';
    const isDown = vitals === 'down';
    const updatedAt = live?.lastUpdated ?? character.lastUpdated;
    const stale = isStale(updatedAt, now);
    const subtitle = [character.class && `${character.class} ${character.level}`, character.race].filter(Boolean).join(' · ') || `Livello ${character.level}`;
    const name = character.name || 'Senza nome';

    const identity = (
        <>
            <Portrait character={character} />
            <span className="min-w-0 flex-1">
                <span className="block truncate font-cinzel text-lg font-bold leading-snug text-foreground">{name}</span>
                <span className="block truncate text-sm capitalize text-muted-foreground">{subtitle}</span>
                {(ownerName || isMine) && (
                    <span className="block truncate text-xs text-muted-foreground">{isMine ? 'Il tuo eroe' : `di ${ownerName}`}</span>
                )}
            </span>
        </>
    );

    return (
        <PlaySection as="div" className={`flex h-full flex-col gap-3 ${isDown ? 'ring-2 ring-destructive/60' : ''}`}>
            <div className="flex items-start gap-2">
                {onOpen ? (
                    <button
                        type="button"
                        onClick={onOpen}
                        aria-label={`Dettagli di ${name}`}
                        className="-m-1 flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-1 text-left transition-colors duration-150 hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {identity}
                    </button>
                ) : (
                    <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>
                )}
                {onToggleInspiration ? (
                    <button
                        type="button"
                        onClick={onToggleInspiration}
                        aria-pressed={inspired}
                        aria-label={inspired ? `Revoca l'Ispirazione Eroica a ${name}` : `Concedi l'Ispirazione Eroica a ${name}`}
                        title={inspired ? 'Ispirazione Eroica: tocca per revocarla' : 'Concedi Ispirazione Eroica'}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-[background-color,color,transform] duration-150 ease-soft active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            inspired ? 'bg-accent/20 text-accent ring-1 ring-accent/50' : 'bg-foreground/5 text-muted-foreground hover:bg-accent/15 hover:text-accent'
                        }`}
                    >
                        <InspirationIcon className="h-5 w-5" />
                    </button>
                ) : inspired ? (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent" title="Ispirazione Eroica">
                        <InspirationIcon className="h-5 w-5" aria-hidden />
                        <span className="sr-only">Ha l'Ispirazione Eroica</span>
                    </span>
                ) : null}
            </div>

            {live ? (
                <div>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-label font-semibold uppercase tracking-widest text-muted-foreground">
                            <HeartIcon aria-hidden className="h-4 w-4 text-destructive" /> PF
                        </span>
                        <span className="font-mono tabular-nums">
                            <span className={`text-2xl font-black ${isDown ? 'text-destructive' : 'text-foreground'}`}>{live.hp.current}</span>
                            <span className="text-base font-semibold text-muted-foreground"> / {live.hp.max}</span>
                            {live.hp.temp > 0 && <span className="ml-1.5 text-sm font-bold text-accent">+{live.hp.temp} temp</span>}
                        </span>
                    </div>
                    <HpBar current={live.hp.current} max={live.hp.max} temp={live.hp.temp} size="md" label={`Punti vita di ${name}`} />
                </div>
            ) : (
                <div className="space-y-2">
                    <VitalsBadge vitals={vitals} />
                    <VitalsBar vitals={vitals} />
                </div>
            )}

            {live && (
                <div className={`grid gap-2 ${variant === 'full' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <BentoStat inset small label="CA" value={live.armorClass} icon={ShieldIcon} />
                    {variant === 'full' ? (
                        <>
                            <BentoStat inset small label="Vel" value={live.speed} icon={ForwardIcon} />
                            <BentoStat inset small label="CD" value={live.spellSaveDC ?? '—'} icon={SparklesIcon} />
                        </>
                    ) : (
                        <BentoStat inset small label="Vel" value={live.speed} icon={ForwardIcon} />
                    )}
                </div>
            )}

            {live && variant === 'full' && <PassiveScoresRow passives={live.passives} />}
            {live && variant === 'full' && <SpellSlotPips slots={live.spellSlots} />}

            {(conditions.length > 0 || (live && isDown)) && (
                <div className="flex flex-wrap items-center gap-1.5">
                    {conditions.map((c) => (
                        <span key={c} className="inline-flex items-center rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">{conditionLabel(c)}</span>
                    ))}
                    {live && isDown && (
                        <span className="ml-auto flex items-center gap-2 font-mono text-sm font-bold" aria-label={`Tiri contro la morte: ${live.deathSaves.successes} successi, ${live.deathSaves.failures} fallimenti`}>
                            <span className="flex items-center gap-0.5 text-success"><CheckIcon aria-hidden className="h-4 w-4" /> {live.deathSaves.successes}/3</span>
                            <span className="flex items-center gap-0.5 text-destructive"><SkullIcon aria-hidden className="h-4 w-4" /> {live.deathSaves.failures}/3</span>
                        </span>
                    )}
                </div>
            )}

            {variant === 'full' && (
                <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className={stale ? 'font-semibold text-warning' : ''}>aggiornato {describeAgo(updatedAt, now)}</span>
                    {pending.map((a) => (
                        <span key={a.id} className={playChipClass}>{DM_ACTION_LABELS[a.type]} in attesa…</span>
                    ))}
                </p>
            )}
            {footer && <div className="mt-auto">{footer}</div>}
        </PlaySection>
    );
};
