export const getModifier = (score: number): number => Math.floor((score - 10) / 2);

export const formatModifier = (mod: number): string => (mod >= 0 ? `+${mod}` : String(mod));

// One signed term: "+2d6", "-1", "d20", "+ 3"
const TERM = /([+-]?)\s*(?:(\d*)d(\d+)|(\d+))/gi;

/**
 * Parses and rolls a dice expression such as "1d8+4", "2d6 - 1", "d20+5" or "1d6+1d4+2".
 * Returns the total and a readable breakdown, e.g. "[3+5] + 4 = 12".
 */
/** Generatore casuale in [0, 1): iniettabile nei test. */
export type Rng = () => number;

export const rollDiceExpression = (diceString: string, rng: Rng = Math.random): { total: number; pretty: string } => {
    if (!diceString || typeof diceString !== 'string') return { total: 0, pretty: 'Formula non valida' };

    let total = 0;
    const prettyParts: string[] = [];
    for (const m of diceString.matchAll(TERM)) {
        const sign = m[1] === '-' ? -1 : 1;
        if (m[3]) {
            const count = Math.min(100, m[2] ? parseInt(m[2], 10) : 1);
            const faces = parseInt(m[3], 10);
            if (!count || !faces) continue;
            const rolls = Array.from({ length: count }, () => Math.floor(rng() * faces) + 1);
            const sub = rolls.reduce((a, b) => a + b, 0);
            total += sign * sub;
            prettyParts.push(`${sign < 0 ? '- ' : prettyParts.length ? '+ ' : ''}[${rolls.join('+')}]`);
        } else if (m[4]) {
            const n = parseInt(m[4], 10);
            total += sign * n;
            prettyParts.push(`${sign < 0 ? '- ' : prettyParts.length ? '+ ' : ''}${n}`);
        }
    }

    if (prettyParts.length === 0) return { total: 0, pretty: 'Formula non valida' };
    return { total, pretty: `${prettyParts.join(' ')} = ${total}` };
};

/** Doubles every dice term ("2d6+3" -> "4d6+3"), for critical hits. */
export const doubleDice = (diceString: string): string =>
    diceString.replace(/(\d*)d(\d+)/gi, (_, n: string, f: string) => `${(n ? parseInt(n, 10) : 1) * 2}d${f}`);
