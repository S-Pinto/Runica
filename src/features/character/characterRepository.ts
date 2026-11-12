// Persistenza dei personaggi: Firestore se l'utente è loggato, localStorage altrimenti.
// Nessuna regola di gioco e nessuna UI: solo I/O.
import {
    collection, doc, getDocs, setDoc, deleteDoc, writeBatch, onSnapshot, query, getDoc,
    type CollectionReference, type DocumentData,
} from 'firebase/firestore';
import type { ICharacter } from './characterTypes';
import { getFirebase } from '../../lib/getFirebase';
import * as storageService from '../../services/storageService';
import { createNewCharacter, mergeWithDefaults } from './rules/defaults';
import { cleanUndefinedValues, buildDuplicate, selectCharactersToMigrate } from './rules/characterData';

const LOCAL_STORAGE_KEY = 'runica-characters';

const getLocalCharacters = (): ICharacter[] => {
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!data) return [];
        const parsed = JSON.parse(data) as Partial<ICharacter>[];
        return parsed.map(mergeWithDefaults);
    } catch (error) {
        console.error('Error reading from local storage', error);
        return [];
    }
};

const saveLocalCharacters = (characters: ICharacter[]) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(characters));
    } catch (error) {
        console.error('Error saving to local storage', error);
    }
};

const getCharactersCollection = (): CollectionReference<DocumentData> | null => {
    try {
        const { db, auth } = getFirebase();
        if (!auth.currentUser) return null;
        return collection(db, 'users', auth.currentUser.uid, 'characters');
    } catch {
        // Firebase non inizializzato: modalità offline.
        return null;
    }
};

const getCharacterDocRef = (id: string) => {
    const coll = getCharactersCollection();
    return coll ? doc(coll, id) : null;
};

export const onCharactersSnapshot = (callback: (characters: ICharacter[]) => void): (() => void) => {
    const coll = getCharactersCollection();
    if (coll) {
        return onSnapshot(query(coll), (snapshot) => {
            callback(snapshot.docs.map(d => mergeWithDefaults(d.data() as Partial<ICharacter>)));
        });
    }
    callback(getLocalCharacters());
    return () => { };
};

export const getCharacter = async (id: string): Promise<ICharacter | null> => {
    if (id === 'new') {
        return createNewCharacter();
    }
    const docRef = getCharacterDocRef(id);
    if (docRef) {
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? mergeWithDefaults(docSnap.data() as Partial<ICharacter>) : null;
    }
    return getLocalCharacters().find(c => c.id === id) || null;
};

export const saveCharacter = async (character: ICharacter): Promise<ICharacter> => {
    const charToSave = cleanUndefinedValues({ ...character, lastUpdated: Date.now() });
    const docRef = getCharacterDocRef(charToSave.id);
    if (docRef) {
        await setDoc(docRef, charToSave);
    } else {
        const characters = getLocalCharacters();
        const index = characters.findIndex(c => c.id === charToSave.id);
        if (index > -1) {
            characters[index] = charToSave;
        } else {
            characters.push(charToSave);
        }
        saveLocalCharacters(characters);
    }
    return charToSave;
};

export const deleteCharacter = async (id: string): Promise<void> => {
    const docRef = getCharacterDocRef(id);
    if (docRef) {
        await deleteDoc(docRef);
    } else {
        saveLocalCharacters(getLocalCharacters().filter(c => c.id !== id));
    }
};

export const saveCharacterOrder = async (characters: ICharacter[]): Promise<void> => {
    const coll = getCharactersCollection();
    if (coll) {
        const { db } = getFirebase();
        const batch = writeBatch(db);
        // Aggiorna solo `order`: i personaggi vengono dalla lista, quindi esistono già.
        characters.forEach((char, index) => {
            batch.update(doc(coll, char.id), { order: index });
        });
        await batch.commit();
    } else {
        saveLocalCharacters(characters.map((c, index) => ({ ...c, order: index })));
    }
};

/** Tutti i personaggi: da Firestore se loggati, dal localStorage altrimenti. */
export const getAllCharacters = async (): Promise<ICharacter[]> => {
    const coll = getCharactersCollection();
    if (coll) {
        const snapshot = await getDocs(coll);
        return snapshot.docs.map(d => d.data() as ICharacter);
    }
    return getLocalCharacters();
};

/** Sostituisce tutti i personaggi con quelli importati. */
export const importCharacters = async (characters: ICharacter[]): Promise<void> => {
    const sanitized = characters.map(mergeWithDefaults);
    const coll = getCharactersCollection();
    if (coll) {
        const { db } = getFirebase();
        const batch = writeBatch(db);
        const existingSnapshot = await getDocs(coll);
        existingSnapshot.forEach(d => batch.delete(d.ref));
        sanitized.forEach(character => batch.set(doc(coll, character.id), character));
        await batch.commit();
    } else {
        saveLocalCharacters(sanitized);
    }
};

export const clearAllData = async (): Promise<void> => {
    const coll = getCharactersCollection();
    if (coll) {
        const { db } = getFirebase();
        const batch = writeBatch(db);
        const snapshot = await getDocs(coll);
        snapshot.forEach(d => batch.delete(d.ref));
        await batch.commit();
    } else {
        saveLocalCharacters([]);
    }
};

export const duplicateCharacter = async (character: ICharacter): Promise<ICharacter> => {
    const cloned = buildDuplicate(character);
    await saveCharacter(cloned);
    return cloned;
};

// --- Migrazione locale → cloud (la conferma all'utente sta nel livello UI) ---

/** True se l'utente è loggato e ci sono personaggi salvati solo in locale. */
export const hasLocalCharactersToMigrate = (): boolean => {
    try {
        const { auth } = getFirebase();
        if (!auth.currentUser) return false;
    } catch {
        return false;
    }
    return getLocalCharacters().length > 0;
};

export type MigrationResult =
    | { status: 'unavailable' }
    | { status: 'migrated'; count: number }
    | { status: 'upToDate' }
    | { status: 'failed' };

/** Sposta su Firestore i personaggi locali più recenti, poi svuota il localStorage. */
export const migrateLocalCharactersToCloud = async (): Promise<MigrationResult> => {
    let firebase;
    try {
        firebase = getFirebase();
    } catch {
        return { status: 'unavailable' };
    }
    const { db, auth } = firebase;
    const coll = getCharactersCollection();
    const user = auth.currentUser;
    if (!coll || !user) return { status: 'unavailable' };

    const localCharacters = getLocalCharacters();
    const cloudSnapshot = await getDocs(coll);
    const cloudCharacters = cloudSnapshot.docs.map(d => d.data() as ICharacter);
    const toMigrate = selectCharactersToMigrate(localCharacters, cloudCharacters);

    if (toMigrate.length === 0) {
        saveLocalCharacters([]);
        return { status: 'upToDate' };
    }

    const batch = writeBatch(db);
    for (const localChar of toMigrate) {
        const charToMigrate = { ...localChar };
        // Un'immagine base64 locale va caricata prima su Storage.
        if (charToMigrate.imageUrl && charToMigrate.imageUrl.startsWith('data:image')) {
            try {
                charToMigrate.imageUrl = await storageService.uploadCharacterImageFromDataUrl(
                    charToMigrate.imageUrl, user.uid, charToMigrate.id,
                );
            } catch (error) {
                console.error(`Failed to upload image for character ${charToMigrate.name}.`, error);
                // Evita l'errore di dimensione di Firestore con un data URL.
                charToMigrate.imageUrl = '';
            }
        }
        batch.set(doc(coll, localChar.id), charToMigrate);
    }

    try {
        await batch.commit();
        saveLocalCharacters([]);
        return { status: 'migrated', count: toMigrate.length };
    } catch (error) {
        console.error('Failed to migrate characters:', error);
        return { status: 'failed' };
    }
};
