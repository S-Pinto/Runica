export interface WeaponPropertyDef {
    name: string;
    description: string;
}

/**
 * Weapon masteries and properties (5e, 2024 rules). Keys stay in English because
 * they are stored on attacks/items; `name` is the Italian label.
 */
export const WEAPON_MASTERIES: Record<string, WeaponPropertyDef> = {
    "Vex": { name: "Irritare", description: "Se colpisci e infliggi danni, hai vantaggio al prossimo tiro per colpire contro quella creatura entro la fine del tuo prossimo turno." },
    "Sap": { name: "Fiaccare", description: "Se colpisci, la creatura ha svantaggio al suo prossimo tiro per colpire prima dell'inizio del tuo prossimo turno." },
    "Nick": { name: "Intaccare", description: "L'attacco extra della proprietà Leggera può far parte dell'azione di Attacco invece di richiedere un'azione bonus." },
    "Cleave": { name: "Fendere", description: "Se colpisci, puoi attaccare una seconda creatura entro 1,5 m dalla prima e nella tua portata. Se la colpisci, subisce danni pari al tuo modificatore di caratteristica. Una volta per turno." },
    "Graze": { name: "Sfiorare", description: "Se manchi, infliggi comunque danni pari al tuo modificatore di caratteristica, dello stesso tipo dell'arma." },
    "Push": { name: "Spingere", description: "Se colpisci una creatura Grande o più piccola, puoi spingerla fino a 3 m lontano da te." },
    "Slow": { name: "Rallentare", description: "Se colpisci e infliggi danni, la velocità della creatura si riduce di 3 m fino all'inizio del tuo prossimo turno." },
    "Topple": { name: "Rovesciare", description: "Se colpisci, la creatura effettua un tiro salvezza su Costituzione (CD 8 + competenza + modificatore usato per l'attacco). Se fallisce, è prona." },
};

export const WEAPON_PROPERTIES: Record<string, WeaponPropertyDef> = {
    "Ammunition": { name: "Munizioni", description: "Serve una munizione per ogni attacco a distanza." },
    "Finesse": { name: "Accurata", description: "Per attacco e danni puoi usare Forza o Destrezza, a tua scelta." },
    "Heavy": { name: "Pesante", description: "Hai svantaggio se la tua Forza (mischia) o Destrezza (distanza) è inferiore a 13." },
    "Light": { name: "Leggera", description: "Quando attacchi con un'arma leggera, puoi fare un attacco extra con un'altra arma leggera come azione bonus." },
    "Loading": { name: "Ricarica", description: "Puoi sparare un solo colpo per azione, azione bonus o reazione, anche se hai più attacchi." },
    "Range": { name: "Gittata", description: "Può essere usata per attacchi a distanza; la gittata è indicata tra parentesi." },
    "Reach": { name: "Portata", description: "Aggiunge 1,5 m alla tua portata quando attacchi con quest'arma." },
    "Thrown": { name: "Da lancio", description: "Puoi lanciarla per un attacco a distanza usando la stessa caratteristica dell'attacco in mischia." },
    "Two-Handed": { name: "A due mani", description: "Richiede due mani per attaccare." },
    "Versatile": { name: "Versatile", description: "Si può usare a una o due mani; il danno tra parentesi vale impugnandola a due mani." },
    "Silvered": { name: "Argentata", description: "Efficace contro licantropi e alcuni altri mostri." },
    "Adamantine": { name: "Adamantio", description: "Efficace contro oggetti e costrutti; i colpi contro gli oggetti sono critici." },
    "Magical": { name: "Magica", description: "Supera la resistenza ai danni non magici." },
};
