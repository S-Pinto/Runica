import type { DmActionType, IDmAction, ILiveStats, ISharedCharacter } from '../../character/characterTypes';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { InspirationIcon, MoonIcon, SunIcon, UserCircleIcon, XMarkIcon } from '../../../components/ui/icons';
import { BentoStat } from '../../character/components/ui/BentoStat';
import { playInsetClass, playLabelClass } from '../../character/components/play-view/PlaySection';
import { DM_ACTION_LABELS } from '../../../lib/labels';
import { describeAgo } from '../../character/rules/campaign';
import { PartyMemberTile } from './PartyMemberTile';

interface PartyMemberDetailProps {
    character: ISharedCharacter | null;
    live?: ILiveStats;
    ownerName?: string;
    pending: IDmAction[];
    now: number;
    onClose: () => void;
    onAction: (type: DmActionType, targets: string[]) => void;
    /** Ritira un'azione non ancora applicata. */
    onCancelAction: (action: IDmAction) => void;
}

/** Dettaglio di un PG per il DM (finestra: in basso su telefono, centrata da `sm`), con le azioni per lui solo. */
export const PartyMemberDetail = ({ character, live, ownerName, pending, now, onClose, onAction, onCancelAction }: PartyMemberDetailProps) => {
    if (!character) return null;
    const inspired = live?.heroicInspiration ?? character.heroicInspiration ?? false;
    const target = [character.id];
    const hitDiceLeft = live ? `${Math.max(0, (parseInt(live.hitDice.total, 10) || 0) - live.hitDice.used)}` : '—';

    return (
        <Modal open onClose={onClose} title={character.name || 'Senza nome'} icon={<UserCircleIcon />} size="lg">
            <div className="space-y-4">
                <PartyMemberTile character={character} live={live} ownerName={ownerName} variant="full" pending={pending} now={now} />

                {live && (
                    <BentoStat inset small label="Dadi vita rimasti" value={hitDiceLeft} sub={live.hitDice.total ? `su ${live.hitDice.total}` : undefined} />
                )}

                <div className="space-y-2">
                    <p className={`${playLabelClass} font-semibold tracking-widest`}>Solo per {character.name || 'questo eroe'}</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                        <Button variant="secondary" onClick={() => onAction(inspired ? 'revokeInspiration' : 'grantInspiration', target)}>
                            <InspirationIcon className="h-4 w-4" /> {inspired ? 'Revoca ispirazione' : 'Ispirazione'}
                        </Button>
                        <Button variant="secondary" onClick={() => onAction('shortRest', target)}>
                            <SunIcon className="h-4 w-4" /> Riposo breve
                        </Button>
                        <Button variant="secondary" onClick={() => onAction('longRest', target)}>
                            <MoonIcon className="h-4 w-4" /> Riposo lungo
                        </Button>
                    </div>
                </div>

                {pending.length > 0 && (
                    <div className="space-y-2">
                        <p className={`${playLabelClass} font-semibold tracking-widest`}>In attesa del giocatore</p>
                        <ul className="space-y-1.5">
                            {pending.map((a) => (
                                <li key={a.id} className={`${playInsetClass} flex min-h-12 items-center gap-3 px-3 py-1.5`}>
                                    <span className="min-w-0 flex-1 text-sm text-text">
                                        {DM_ACTION_LABELS[a.type]} <span className="text-muted-foreground">· inviata {describeAgo(a.createdAt, now)}</span>
                                    </span>
                                    {a.targets.length === 1 && (
                                        <Button size="sm" variant="ghost" onClick={() => onCancelAction(a)} aria-label={`Ritira ${DM_ACTION_LABELS[a.type]}`}>
                                            <XMarkIcon className="h-4 w-4" /> Ritira
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Modal>
    );
};
