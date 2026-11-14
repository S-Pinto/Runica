import { useEffect, useRef, useState } from 'react';
import * as campaignService from '../../../services/campaignService';
import { describeDataError } from '../../../lib/errors';
import { toast } from '../../../components/ui/Dialogs';
import { LockIcon } from '../../../components/ui/icons';
import { PlaySection } from '../../character/components/play-view/PlaySection';
import { StyledTextArea } from '../../character/components/ui/StyledInputs';
import { describeAgo, DM_NOTES_MAX } from '../../character/rules/campaign';

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved';

/** Note segrete del DM (`dmPrivate/notes`): visibili solo a lui, salvate da sole dopo 1,5 s di quiete. */
export const DmNotesTab = ({ campaignId, now }: { campaignId: string; now: number }) => {
    const [text, setText] = useState('');
    const [loaded, setLoaded] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<number | undefined>();
    const [state, setState] = useState<SaveState>('idle');
    const dirty = useRef(false);
    const latest = useRef('');

    useEffect(() => {
        return campaignService.onDmNotesSnapshot(
            campaignId,
            (notes) => {
                // Mentre si scrive non si sovrascrive il campo con l'eco del server.
                if (!dirty.current) setText(notes?.text ?? '');
                setUpdatedAt(notes?.updatedAt);
                setLoaded(true);
            },
            (error) => {
                setLoaded(true);
                toast.error(describeDataError(error, 'Impossibile caricare le note.'));
            },
        );
    }, [campaignId]);

    useEffect(() => {
        if (!dirty.current) return;
        const handle = setTimeout(async () => {
            setState('saving');
            const saving = latest.current;
            try {
                await campaignService.saveDmNotes(campaignId, saving);
                // Se nel frattempo si è scritto ancora, il prossimo giro salverà il resto.
                if (latest.current === saving) {
                    dirty.current = false;
                    setState('saved');
                }
            } catch (error) {
                setState('dirty');
                toast.error(describeDataError(error, 'Note non salvate.'));
            }
        }, 1500);
        return () => clearTimeout(handle);
    }, [text, campaignId]);

    const status = state === 'saving' ? 'Salvataggio…' : state === 'dirty' ? 'Modifiche da salvare' : updatedAt ? `Salvate ${describeAgo(updatedAt, now)}` : 'Nessuna nota';

    return (
        <PlaySection
            title="Note segrete"
            icon={<LockIcon className="text-accent" />}
            aside={<span className="text-xs text-muted-foreground" role="status">{status}</span>}
        >
            <p className="mb-3 text-sm text-muted-foreground">Solo tu le vedi: trame, PNG, tesori nascosti. I giocatori non possono leggerle.</p>
            <StyledTextArea
                label="Appunti del DM"
                subLabel={`${text.length.toLocaleString('it-IT')} / ${DM_NOTES_MAX.toLocaleString('it-IT')}`}
                value={text}
                disabled={!loaded}
                maxLength={DM_NOTES_MAX}
                rows={16}
                placeholder={loaded ? 'La cripta sotto il tempio è sigillata da…' : 'Caricamento…'}
                onChange={(e) => {
                    dirty.current = true;
                    latest.current = e.target.value;
                    setState('dirty');
                    setText(e.target.value);
                }}
                className="[&_textarea]:min-h-[50vh]"
            />
        </PlaySection>
    );
};
