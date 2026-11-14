import { useState } from 'react';
import type { ICampaign } from '../../character/characterTypes';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { EditIcon } from '../../../components/ui/icons';
import { fieldControlClass, fieldLabelClass } from '../../../components/ui/field';

interface CampaignEditModalProps {
    campaign: ICampaign;
    open: boolean;
    onClose: () => void;
    onSave: (name: string, description: string) => Promise<void>;
}

/** Rinomina la campagna e ne cambia la descrizione (solo DM). */
export const CampaignEditModal = ({ campaign, open, onClose, onSave }: CampaignEditModalProps) => {
    const [name, setName] = useState(campaign.name);
    const [description, setDescription] = useState(campaign.description ?? '');
    const [busy, setBusy] = useState(false);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Modifica campagna"
            icon={<EditIcon />}
            footer={
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="ghost" onClick={onClose}>Annulla</Button>
                    <Button type="submit" form="campaign-edit-form" disabled={busy || !name.trim()}>Salva</Button>
                </div>
            }
        >
            <form
                id="campaign-edit-form"
                className="space-y-4"
                onSubmit={async (e) => {
                    e.preventDefault();
                    if (!name.trim()) return;
                    setBusy(true);
                    try {
                        await onSave(name, description);
                        onClose();
                    } finally {
                        setBusy(false);
                    }
                }}
            >
                <div>
                    <label className={fieldLabelClass} htmlFor="edit-campaign-name">Nome</label>
                    <input id="edit-campaign-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required className={fieldControlClass} />
                </div>
                <div>
                    <label className={fieldLabelClass} htmlFor="edit-campaign-desc">Descrizione</label>
                    <textarea id="edit-campaign-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={4}
                        className={`${fieldControlClass} resize-y`} />
                </div>
            </form>
        </Modal>
    );
};
