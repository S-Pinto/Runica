export interface ConditionDef {
    name: string;
    description: string;
    bullets: string[];
}

/**
 * Condition summaries (5e, 2024 rules). Keys stay in English because they are
 * stored on characters (character.conditions); `name` is the Italian label.
 */
export const CONDITIONS: Record<string, ConditionDef> = {
    'Blinded': {
        name: 'Accecato',
        description: 'Non vedi e fallisci automaticamente le prove che richiedono la vista.',
        bullets: [
            'I tiri per colpire contro di te hanno vantaggio.',
            'I tuoi tiri per colpire hanno svantaggio.',
        ],
    },
    'Charmed': {
        name: 'Affascinato',
        description: 'Non puoi attaccare chi ti ha affascinato né bersagliarlo con effetti dannosi.',
        bullets: ['Chi ti ha affascinato ha vantaggio alle prove per interagire socialmente con te.'],
    },
    'Deafened': {
        name: 'Assordato',
        description: 'Non senti.',
        bullets: ['Fallisci automaticamente le prove che richiedono l\'udito.'],
    },
    'Exhaustion': {
        name: 'Indebolimento',
        description: 'Si accumula a livelli (da 1 a 6). Un riposo lungo lo riduce di 1 livello.',
        bullets: [
            'I tiri di d20 subiscono −2 per ogni livello.',
            'La velocità si riduce di 1,5 m (5 ft) per ogni livello.',
            'Al livello 6 muori.',
        ],
    },
    'Frightened': {
        name: 'Spaventato',
        description: 'Hai svantaggio alle prove e ai tiri per colpire finché vedi la fonte della paura.',
        bullets: ['Non puoi avvicinarti volontariamente alla fonte della paura.'],
    },
    'Grappled': {
        name: 'Afferrato',
        description: 'La tua velocità è 0 e non può aumentare.',
        bullets: [
            'Hai svantaggio ai tiri per colpire contro chiunque non sia chi ti afferra.',
            'Finisce se chi ti afferra è incapacitato o se vieni allontanato dalla sua portata.',
        ],
    },
    'Incapacitated': {
        name: 'Incapacitato',
        description: 'Non puoi effettuare azioni, azioni bonus né reazioni.',
        bullets: ['Non puoi parlare e perdi la concentrazione.'],
    },
    'Invisible': {
        name: 'Invisibile',
        description: 'Non puoi essere visto senza magia o sensi speciali.',
        bullets: [
            'I tiri per colpire contro di te hanno svantaggio.',
            'I tuoi tiri per colpire hanno vantaggio.',
        ],
    },
    'Paralyzed': {
        name: 'Paralizzato',
        description: 'Sei incapacitato e non puoi muoverti. Fallisci i tiri salvezza su Forza e Destrezza.',
        bullets: [
            'I tiri per colpire contro di te hanno vantaggio.',
            'Ogni colpo da entro 1,5 m è un colpo critico.',
        ],
    },
    'Petrified': {
        name: 'Pietrificato',
        description: 'Sei trasformato in una sostanza inanimata (di solito pietra). Sei incapacitato e non puoi muoverti né parlare.',
        bullets: [
            'I tiri per colpire contro di te hanno vantaggio.',
            'Fallisci i tiri salvezza su Forza e Destrezza.',
            'Hai resistenza a tutti i danni.',
            'Sei immune alla condizione avvelenato.',
        ],
    },
    'Poisoned': {
        name: 'Avvelenato',
        description: 'Ti senti male.',
        bullets: ['Hai svantaggio ai tiri per colpire e alle prove di caratteristica.'],
    },
    'Prone': {
        name: 'Prono',
        description: 'Puoi solo strisciare, o rialzarti spendendo metà della velocità.',
        bullets: [
            'I tuoi tiri per colpire hanno svantaggio.',
            'Gli attacchi contro di te hanno vantaggio entro 1,5 m, svantaggio oltre.',
        ],
    },
    'Restrained': {
        name: 'Trattenuto',
        description: 'La tua velocità è 0. Hai svantaggio ai tiri salvezza su Destrezza.',
        bullets: [
            'I tiri per colpire contro di te hanno vantaggio.',
            'I tuoi tiri per colpire hanno svantaggio.',
        ],
    },
    'Stunned': {
        name: 'Stordito',
        description: 'Sei incapacitato. Fallisci i tiri salvezza su Forza e Destrezza.',
        bullets: ['I tiri per colpire contro di te hanno vantaggio.'],
    },
    'Unconscious': {
        name: 'Privo di sensi',
        description: 'Sei incapacitato, prono e ignaro di ciò che ti circonda. Lasci cadere ciò che tieni.',
        bullets: [
            'Fallisci i tiri salvezza su Forza e Destrezza.',
            'I tiri per colpire contro di te hanno vantaggio.',
            'Ogni colpo da entro 1,5 m è un colpo critico.',
        ],
    },
};
