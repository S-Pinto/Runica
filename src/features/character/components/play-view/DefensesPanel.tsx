import { ReactNode, useMemo } from 'react';
import { ICharacter } from '../../characterTypes';
import { ShieldCheckIcon } from '../../../../components/ui/icons';
import { damageTypeLabel } from '../../../../lib/labels';
import { formatSense, getActiveDefenses, getItemLanguages, getItemSenses, type DefenseEntry } from '../../rules/itemEffects';
import { PlaySection, playLabelClass } from './PlaySection';

/** Etichetta di una difesa con la sua fonte: "Fuoco — Embarmor". */
const SourceChip = ({ label, sources, tone = 'accent' }: { label: string; sources: string[]; tone?: 'accent' | 'destructive' }) => (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${tone === 'accent' ? 'bg-accent/15 text-accent' : 'bg-destructive/15 text-destructive'}`}>
        {label}
        <span className="font-normal opacity-80">— {sources.join(', ')}</span>
    </span>
);

const DefenseColumn = ({ title, hint, manual, items, tone }: { title: string; hint: string; manual?: string; items: DefenseEntry[]; tone?: 'accent' | 'destructive' }) => (
    <div>
        <dt className={playLabelClass}>{title} <span className="font-normal normal-case tracking-normal">· {hint}</span></dt>
        <dd className="mt-1.5 space-y-1.5">
            {manual?.trim() && <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{manual}</p>}
            {items.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {items.map(d => <SourceChip key={d.damageType} label={damageTypeLabel(d.damageType)} sources={d.sources} tone={tone} />)}
                </div>
            )}
            {!manual?.trim() && items.length === 0 && <p className="text-sm text-muted-foreground">Nessuna</p>}
        </dd>
    </div>
);

/** Difese della scheda (testo scritto a mano) più quelle date dagli oggetti attivi, con la fonte. */
export const DefensesPanel = ({ character, className = '' }: { character: ICharacter; className?: string }) => {
    const fromItems = useMemo(() => getActiveDefenses(character), [character]);
    const showVulnerabilities = !!character.defenses?.vulnerabilities?.trim() || fromItems.vulnerabilities.length > 0;
    return (
        <PlaySection title="Difese" icon={<ShieldCheckIcon className="text-muted-foreground" />} className={className}>
            <dl className={`grid gap-4 ${showVulnerabilities ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                <DefenseColumn title="Resistenze" hint="danni dimezzati" manual={character.defenses?.resistances} items={fromItems.resistances} />
                <DefenseColumn title="Immunità" hint="nessun danno" manual={character.defenses?.immunities} items={fromItems.immunities} />
                {showVulnerabilities && (
                    <DefenseColumn title="Vulnerabilità" hint="danni doppi" manual={character.defenses?.vulnerabilities} items={fromItems.vulnerabilities} tone="destructive" />
                )}
            </dl>
        </PlaySection>
    );
};

/** Lingue della scheda più quelle degli oggetti, e i sensi dati dagli oggetti. */
export const LanguagesPanel = ({ character, className = '' }: { character: ICharacter; className?: string }) => {
    const languages = useMemo(() => getItemLanguages(character), [character]);
    const senses = useMemo(() => getItemSenses(character), [character]);
    const hasSenses = senses.length > 0;
    const body: ReactNode = (
        <div className="space-y-3">
            {(character.languages?.trim() || languages.length === 0) && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">{character.languages || 'Nessuna'}</p>
            )}
            {languages.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {languages.map(l => <SourceChip key={l.name} label={l.name} sources={l.sources} />)}
                </div>
            )}
            {hasSenses && (
                <div>
                    <p className={`${playLabelClass} mb-1.5`}>Sensi</p>
                    <div className="flex flex-wrap gap-1.5">
                        {senses.map((s, i) => <SourceChip key={`${s.name}-${i}`} label={formatSense(s)} sources={[s.source]} />)}
                    </div>
                </div>
            )}
        </div>
    );
    return <PlaySection title={hasSenses ? 'Lingue e sensi' : 'Lingue'} className={className}>{body}</PlaySection>;
};
