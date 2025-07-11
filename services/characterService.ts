import { ICharacter, AbilityScores, Skill } from '../types';
import { db, auth } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, onSnapshot, query, CollectionReference, getDoc } from 'firebase/firestore';

const getProficiencyBonus = (level: number): number => Math.ceil(level / 4) + 1;
const getModifier = (score: number) => Math.floor((score - 10) / 2);

const getDefaultSkills = (abilityScores: AbilityScores): Skill[] => {
  return [
    { name: 'Acrobatics', ability: 'dexterity', proficient: false, expertise: false },
    { name: 'Animal Handling', ability: 'wisdom', proficient: false, expertise: false },
    { name: 'Arcana', ability: 'intelligence', proficient: false, expertise: false },
    { name: 'Athletics', ability: 'strength', proficient: false, expertise: false },
    { name: 'Deception', ability: 'charisma', proficient: false, expertise: false },
    { name: 'History', ability: 'intelligence', proficient: false, expertise: false },
    { name: 'Insight', ability: 'wisdom', proficient: false, expertise: false },
    { name: 'Intimidation', ability: 'charisma', proficient: false, expertise: false },
    { name: 'Investigation', ability: 'intelligence', proficient: false, expertise: false },
    { name: 'Medicine', ability: 'wisdom', proficient: false, expertise: false },
    { name: 'Nature', ability: 'intelligence', proficient: false, expertise: false },
    { name: 'Perception', ability: 'wisdom', proficient: false, expertise: false },
    { name: 'Performance', ability: 'charisma', proficient: false, expertise: false },
    { name: 'Persuasion', ability: 'charisma', proficient: false, expertise: false },
    { name: 'Religion', ability: 'intelligence', proficient: false, expertise: false },
    { name: 'Sleight of Hand', ability: 'dexterity', proficient: false, expertise: false },
    { name: 'Stealth', ability: 'dexterity', proficient: false, expertise: false },
    { name: 'Survival', ability: 'wisdom', proficient: false, expertise: false },
  ];
};

export const createNewCharacter = (): ICharacter => {
  const abilityScores: AbilityScores = {
    strength: 10, dexterity: 10, constitution: 10,
    intelligence: 10, wisdom: 10, charisma: 10,
  };
  return {
    id: `new_${Date.now()}`,
    lastUpdated: Date.now(),
    name: '', class: '', subclass: '', level: 1, race: '',
    alignment: '', background: '', playerName: '', experiencePoints: 0,
    abilityScores, inspiration: 0,
    proficiencyBonus: getProficiencyBonus(1),
    savingThrows: {
      strength: { proficient: false }, dexterity: { proficient: false },
      constitution: { proficient: false }, intelligence: { proficient: false },
      wisdom: { proficient: false }, charisma: { proficient: false },
    },
    skills: getDefaultSkills(abilityScores),
    armorClass: 10 + getModifier(abilityScores.dexterity), 
    initiative: getModifier(abilityScores.dexterity), 
    speed: 30,
    hp: { max: 10, current: 10, temporary: 0 },
    hitDice: { total: '1d8', used: 0 },
    deathSaves: { successes: 0, failures: 0 },
    personalityTraits: '', ideals: '', bonds: '', flaws: '',
    languages: 'Common', attacks: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    equipment: [], featuresAndTraits: [],
    notes: '', dmNotes: '',
    spellcastingAbility: '', spells: [],
    spellSlots: {
        1: { max: 0, used: 0 }, 2: { max: 0, used: 0 }, 3: { max: 0, used: 0 },
        4: { max: 0, used: 0 }, 5: { max: 0, used: 0 }, 6: { max: 0, used: 0 },
        7: { max: 0, used: 0 }, 8: { max: 0, used: 0 }, 9: { max: 0, used: 0 },
    },
    customResources: [],
  };
};

const LOCAL_STORAGE_KEY = 'runica-characters';
const getLocalCharacters = (): ICharacter[] => {
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        // Ensure that loaded data conforms to the latest ICharacter structure
        return data ? JSON.parse(data).map((c: any) => ({...createNewCharacter(), ...c})) : [];
    } catch (error) {
        console.error("Error reading from local storage", error);
        return [];
    }
};

const saveLocalCharacters = (characters: ICharacter[]) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(characters));
    } catch (error) {
        console.error("Error saving to local storage", error);
    }
};

const getCharactersCollection = (): CollectionReference | null => {
    if (!db || !auth?.currentUser) return null;
    return collection(db, 'users', auth.currentUser.uid, 'characters');
};

const getCharacterDocRef = (id: string) => {
    const coll = getCharactersCollection();
    if (!coll) return null;
    return doc(coll, id);
};

export const onCharactersSnapshot = (callback: (characters: ICharacter[]) => void): (() => void) => {
    const coll = getCharactersCollection();
    if (coll) {
        return onSnapshot(query(coll), (snapshot) => {
            const characters = snapshot.docs.map(d => d.data() as ICharacter);
            callback(characters);
        });
    } else {
        callback(getLocalCharacters());
        return () => {};
    }
};

export const getCharacter = async (id: string): Promise<ICharacter | null> => {
    if (id === 'new') {
        return createNewCharacter();
    }
    const docRef = getCharacterDocRef(id);
    if (docRef) {
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() as ICharacter : null;
    } else {
        return getLocalCharacters().find(c => c.id === id) || null;
    }
};

export const saveCharacter = async (character: ICharacter): Promise<ICharacter> => {
    const charToSave = { ...character, lastUpdated: Date.now() };
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
        const characters = getLocalCharacters();
        saveLocalCharacters(characters.filter(c => c.id !== id));
    }
};

export const migrateLocalDataToFirestore = async () => {
    if (!db || !auth?.currentUser) return;
    const localCharacters = getLocalCharacters();
    if (localCharacters.length === 0) return;

    if (!window.confirm("You have local characters saved on this device. Do you want to move them to your account? This will merge them with any existing characters on your account.")) {
        return;
    }
    const coll = getCharactersCollection();
    if (!coll) return;

    const batch = writeBatch(db);
    const cloudSnapshot = await getDocs(coll);
    const cloudCharacters = cloudSnapshot.docs.map(d => d.data() as ICharacter);
    
    let migratedCount = 0;
    localCharacters.forEach(localChar => {
        const cloudVersion = cloudCharacters.find(c => c.id === localChar.id);
        if (!cloudVersion || (localChar.lastUpdated > (cloudVersion.lastUpdated || 0))) {
            const docRef = doc(coll, localChar.id);
            batch.set(docRef, localChar);
            migratedCount++;
        }
    });

    if (migratedCount > 0) {
        try {
            await batch.commit();
            alert(`${migratedCount} character(s) migrated to your account.`);
            saveLocalCharacters([]);
        } catch (error) {
            console.error("Failed to migrate characters:", error);
            alert("There was an error migrating your characters. They remain on this device for now.");
        }
    } else {
        alert("No characters needed to be migrated. Your cloud data is up to date.");
    }
};
