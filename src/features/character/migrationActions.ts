// Azione UI: chiede conferma, sposta i personaggi locali sul cloud e notifica l'esito.
import { confirmDialog, toast } from '../../components/ui/Dialogs';
import { createKeyedGuard } from '../../lib/async';
import { hasLocalCharactersToMigrate, migrateLocalCharactersToCloud } from './characterRepository';

// Utenti per cui la proposta è già in corso o è già stata gestita in questa sessione:
// evita dialoghi doppi (re-mount delle rotte, StrictMode) e di riproporre la migrazione
// a ogni cambio pagina dopo un rifiuto.
const handled = createKeyedGuard();

export const promptAndMigrateLocalCharacters = async (uid: string): Promise<void> => {
    if (!hasLocalCharactersToMigrate()) return;
    if (!handled.tryAcquire(uid)) return;

    try {
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
                // Permette di riprovare al prossimo login/caricamento.
                handled.release(uid);
                toast.error('Spostamento non riuscito: i personaggi restano su questo dispositivo.');
                break;
        }
    } catch (error) {
        handled.release(uid);
        console.error('Migration prompt failed', error);
        toast.error('Spostamento non riuscito: i personaggi restano su questo dispositivo.');
    }
};
