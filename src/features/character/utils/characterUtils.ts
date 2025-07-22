export const getModifier = (score: number): number => Math.floor((score - 10) / 2);

export const formatModifier = (mod: number): string => (mod >= 0 ? `+${mod}` : String(mod));