import type { DmActionType, ISharedCharacter } from '../../character/characterTypes';
import { Menu } from '../../../components/ui/Menu';
import { buttonClass, Button } from '../../../components/ui/Button';
import { ChevronDownIcon, InspirationIcon, MoonIcon, SunIcon } from '../../../components/ui/icons';

interface DmActionBarProps {
    party: ISharedCharacter[];
    /** Invia un'azione: `targets` = id dei personaggi. La conferma la chiede chi chiama. */
    onAction: (type: DmActionType, targets: string[]) => void;
    disabled?: boolean;
}

/**
 * Azioni rapide del DM, sticky sotto la barra dei tab (vetro, l'unico controllo che galleggia nella board):
 * Ispirazione a un PG o a tutti, Riposo breve e Riposo lungo per tutto il gruppo.
 */
export const DmActionBar = ({ party, onAction, disabled }: DmActionBarProps) => {
    const all = party.map((c) => c.id);
    const off = disabled || party.length === 0;
    return (
        <div className="sticky top-[calc(var(--header-offset)+4rem)] z-30">
            <div role="toolbar" aria-label="Azioni del DM" className="glass-pill flex items-center gap-1.5 rounded-2xl p-1.5">
                {off ? (
                    <Button variant="ghost" disabled className="flex-1 sm:flex-none">
                        <InspirationIcon className="h-4 w-4" /> Ispirazione
                    </Button>
                ) : (
                    <div className="min-w-0 flex-[1.4] sm:flex-none"><Menu
                        label="Concedi Ispirazione Eroica"
                        align="start"
                        triggerClassName={buttonClass('ghost', 'md', 'w-full px-2.5 text-text sm:px-4')}
                        trigger={<><InspirationIcon className="h-4 w-4 shrink-0 text-accent" /> Ispirazione <ChevronDownIcon className="h-4 w-4 shrink-0" /></>}
                        header={<p className="px-3 py-2 text-label uppercase text-muted-foreground">Ispirazione Eroica a…</p>}
                        items={[
                            { label: 'Tutto il gruppo', icon: <InspirationIcon className="h-4 w-4" />, onSelect: () => onAction('grantInspiration', all) },
                            ...party.map((c) => ({ label: c.name || 'Senza nome', onSelect: () => onAction('grantInspiration', [c.id]) })),
                        ]}
                    /></div>
                )}
                <span aria-hidden className="h-6 w-px shrink-0 bg-border" />
                <Button variant="ghost" disabled={off} onClick={() => onAction('shortRest', all)} className="min-w-0 flex-1 px-2.5 text-text sm:flex-none sm:px-4" aria-label="Riposo breve per tutto il gruppo">
                    <SunIcon className="h-4 w-4 shrink-0 text-accent" /> <span className="sm:hidden">Breve</span><span className="hidden sm:inline">Riposo breve</span>
                </Button>
                <Button variant="ghost" disabled={off} onClick={() => onAction('longRest', all)} className="min-w-0 flex-1 px-2.5 text-text sm:flex-none sm:px-4" aria-label="Riposo lungo per tutto il gruppo">
                    <MoonIcon className="h-4 w-4 shrink-0 text-accent" /> <span className="sm:hidden">Lungo</span><span className="hidden sm:inline">Riposo lungo</span>
                </Button>
            </div>
        </div>
    );
};
