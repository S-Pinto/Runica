// Azione UI: chiede conferma, sposta i personaggi locali sul cloud e notifica l'esito.
import { confirmDialog, toast } from '../../components/ui/Dialogs';
import { hasLocalCharactersToMigrate, migrateLocalCharactersToCloud } from './characterRepository';

export const promptAndMigrateLocalCharacters = async (): Promise<void> => {
    if (!hasLocalCharactersToMigrate()) return;

    const confirmed = await confirmDialog({
        title: 'Spostare i personaggi sul tuo account?',
        message: 'Su questo dispositivo ci sono personaggi salvati in locale. Verranno uniti a quelli già presenti sul tuo account.',
        confirmLabel: 'Sposta',
    });
    if (!confirmed) return;

    const result = await migrateLocalCharactersToCloud();
    switch (result.status) {
        case 'migrated':
            toast.success(`${result.count} personaggi spostati sul tuo account.`);
            break;
        case 'upToDate':
            toast.info('Nessun personaggio da spostare: il cloud è già aggiornato.');
            break;
        case 'failed':
            toast.error('Spostamento non riuscito: i personaggi restano su questo dispositivo.');
            break;
    }
};
