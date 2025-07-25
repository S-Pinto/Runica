export const getModifier = (score: number): number => Math.floor((score - 10) / 2);

export const formatModifier = (mod: number): string => (mod >= 0 ? `+${mod}` : String(mod));

/**
 * Parses a dice string expression (e.g., "1d8+4", "2d6") and returns the total and a detailed breakdown.
 * @param diceString The string to parse.
 * @returns An object containing the total roll and a formatted string of the details.
 */
export const rollDiceExpression = (diceString: string): { total: number; pretty: string } => {
    if (!diceString || typeof diceString !== 'string') return { total: 0, pretty: 'Invalid input' };

    const parts = diceString.replace(/[\s()]/g, '').split('+');
    let total = 0;
    const prettyParts: string[] = [];
    const diceRegex = /(\d+)d(\d+)/i;

    for (const part of parts) {
        if (!part) continue;
        const diceMatch = part.match(diceRegex);
        if (diceMatch) {
            const numDice = parseInt(diceMatch[1], 10);
            const diceType = parseInt(diceMatch[2], 10);
            if (isNaN(numDice) || isNaN(diceType)) continue;
            const rolls = Array.from({ length: numDice }, () => Math.floor(Math.random() * diceType) + 1);
            const subTotal = rolls.reduce((a, b) => a + b, 0);
            total += subTotal;
            prettyParts.push(`[${rolls.join('+')}]`);
        } else {
            const modifier = parseInt(part, 10);
            if (!isNaN(modifier)) {
                total += modifier;
                prettyParts.push(String(modifier));
            }
        }
    }

    if (prettyParts.length === 0) return { total: 0, pretty: 'Invalid Format' };
    return { total, pretty: `${prettyParts.join(' + ')} = ${total}` };
};