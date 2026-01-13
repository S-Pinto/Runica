export interface ConditionDef {
    name: string;
    description: string;
    bullets: string[];
}

export const CONDITIONS: Record<string, ConditionDef> = {
    'Blinded': {
        name: 'Blinded',
        description: 'You can’t see and automatically fail any ability check that requires sight.',
        bullets: [
            'Attack rolls against you have advantage.',
            'Your attack rolls have disadvantage.'
        ]
    },
    'Charmed': {
        name: 'Charmed',
        description: 'You can’t attack the charmer or target them with harmful effects.',
        bullets: [
            'The charmer has advantage on any ability check to interact socially with you.'
        ]
    },
    'Deafened': {
        name: 'Deafened',
        description: 'You can’t hear.',
        bullets: [
            'You automatically fail any ability check that requires hearing.'
        ]
    },
    'Exhaustion': {
        name: 'Exhaustion',
        description: 'Conditions are cumulative. Finishing a Long Rest reduces level by 1.',
        bullets: [
            'Lv 1: Disadvantage on ability checks',
            'Lv 2: Speed halved',
            'Lv 3: Disadv. on attack rolls and saving throws',
            'Lv 4: Hit point maximum halved',
            'Lv 5: Speed reduced to 0',
            'Lv 6: Death'
        ]
    },
    'Frightened': {
        name: 'Frightened',
        description: 'You have disadvantage on ability checks and attack rolls while the source of your fear is in line of sight.',
        bullets: [
            'You can’t willingly move closer to the source of your fear.'
        ]
    },
    'Grappled': {
        name: 'Grappled',
        description: 'Your speed becomes 0, and you can’t benefit from any bonus to speed.',
        bullets: [
            'Ends if grappler is incapacitated or you are moved out of reach.'
        ]
    },
    'Incapacitated': {
        name: 'Incapacitated',
        description: 'You can’t take actions or reactions.',
        bullets: []
    },
    'Invisible': {
        name: 'Invisible',
        description: 'You can’t be seen without magic or special senses. You are heavily obscured.',
        bullets: [
            'Attack rolls against you have disadvantage.',
            'Your attack rolls have advantage.'
        ]
    },
    'Paralyzed': {
        name: 'Paralyzed',
        description: 'You are incapacitated, can’t move or speak. You automatically fail Str/Dex saves.',
        bullets: [
            'Attack rolls against you have advantage.',
            'Any hit within 5 feet is a critical hit.'
        ]
    },
    'Petrified': {
        name: 'Petrified',
        description: 'Transformed into substance (usually stone). Incapacitated, unaware, can’t move/speak.',
        bullets: [
            'Attack rolls against you have advantage.',
            'Fail all Str/Dex saves.',
            'Resistance to all damage.',
            'Immune to poison/disease.'
        ]
    },
    'Poisoned': {
        name: 'Poisoned',
        description: 'You feel sick/intoxicated.',
        bullets: [
            'Disadvantage on attack rolls and ability checks.'
        ]
    },
    'Prone': {
        name: 'Prone',
        description: 'Combat movement is crawling only.',
        bullets: [
            'You have disadvantage on attack rolls.',
            'Enemies have Advantage if within 5ft, otherwise Disadvantage.'
        ]
    },
    'Restrained': {
        name: 'Restrained',
        description: 'Speed 0. Disadvantage on Dex saves.',
        bullets: [
            'Attack rolls against you have advantage.',
            'Your attack rolls have disadvantage.'
        ]
    },
    'Stunned': {
        name: 'Stunned',
        description: 'Incapacitated, can’t move, speak falteringly. Fail Str/Dex saves.',
        bullets: [
            'Attack rolls against you have advantage.'
        ]
    },
    'Unconscious': {
        name: 'Unconscious',
        description: 'Incapacitated, can’t move/speak, unaware. Drop items, fall prone.',
        bullets: [
            'Fail all Str/Dex saves.',
            'Attack rolls against you have advantage.',
            'Hits from 5ft are criticals.'
        ]
    }
};
