export interface WeaponPropertyDef {
    name: string;
    description: string;
}

export const WEAPON_MASTERIES: Record<string, WeaponPropertyDef> = {
    "Vex": { name: "Vex", description: "If you hit a creature and deal damage, you have Advantage on your next attack roll against that creature before the end of your next turn." },
    "Sap": { name: "Sap", description: "If you hit a creature, it has Disadvantage on its next attack roll before the start of your next turn." },
    "Nick": { name: "Nick", description: "When you make the extra attack of the Light property, you can make it as part of the Attack action instead of as a Bonus Action." },
    "Cleave": { name: "Cleave", description: "If you hit a creature, you can make a second attack roll against a creature within 5 feet of it that is also within your reach. On a hit, the second creature takes damage equal to your ability modifier." },
    "Graze": { name: "Graze", description: "If you miss a creature, you deal damage equal to your ability modifier. This damage is the same type as the weapon's damage." },
    "Push": { name: "Push", description: "If you hit a creature, you can push it up to 10 feet away from you." },
    "Slow": { name: "Slow", description: "If you hit a creature and deal damage, its Speed is reduced by 10 feet until the start of your next turn." },
    "Topple": { name: "Topple", description: "If you hit a creature, you can force it to make a Constitution saving throw (DC 8 + Prof + Ability Mod). On a failed save, the creature has the Prone condition." },
};

export const WEAPON_PROPERTIES: Record<string, WeaponPropertyDef> = {
    "Ammunition": { name: "Ammunition", description: "You need ammunition to use this weapon." },
    "Finesse": { name: "Finesse", description: "Use your Strength or Dexterity modifier for attack and damage rolls." },
    "Heavy": { name: "Heavy", description: "Small creatures have Disadvantage on attack rolls with this weapon." },
    "Light": { name: "Light", description: "A light weapon is small and easy to handle, making it ideal for use when fighting with two weapons." },
    "Loading": { name: "Loading", description: "You can fire only one piece of ammunition from it when you use an action, bonus action, or reaction to fire it, regardless of the number of attacks you can normally make." },
    "Range": { name: "Range", description: "A weapon that can be used to make a ranged attack has a range shown in parentheses." },
    "Reach": { name: "Reach", description: "This weapon adds 5 feet to your reach when you attack with it." },
    "Thrown": { name: "Thrown", description: "If a weapon has the thrown property, you can throw the weapon to make a ranged attack." },
    "Two-Handed": { name: "Two-Handed", description: "This weapon requires two hands to use." },
    "Versatile": { name: "Versatile", description: "This weapon can be used with one or two hands. A damage value in parentheses appears with the property—the damage when the weapon is used with two hands." },
    "Silvered": { name: "Silvered", description: "Effective against lycanthropes and some other monsters." },
    "Adamantine": { name: "Adamantine", description: "Effective against objects and constructs. Critical hits on objects." },
    "Magical": { name: "Magical", description: "Bypasses resistance to non-magical attacks." },
};
