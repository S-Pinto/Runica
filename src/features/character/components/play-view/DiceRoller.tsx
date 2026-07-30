import React, { useState } from 'react';
import { SparklesIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon } from '../../../../components/ui/icons';

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
type AdvantageMode = 'normal' | 'advantage' | 'disadvantage';

interface RollResult {
  dice: DiceType;
  rolls: number[];
  selectedRoll: number;
  modifier: number;
  total: number;
  mode: AdvantageMode;
  timestamp: number;
}

interface DiceRollerProps {
  mode?: 'dock' | 'modal';
  isOpen?: boolean;
  onClose?: () => void;
}

const DICE_FACES: Record<DiceType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

export const DiceRoller: React.FC<DiceRollerProps> = ({ mode = 'dock', isOpen = false, onClose }) => {
  const [selectedDice, setSelectedDice] = useState<DiceType>('d20');
  const [modifier, setModifier] = useState<number>(0);
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('normal');
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const rollDice = () => {
    setIsRolling(true);
    const faces = DICE_FACES[selectedDice];

    setTimeout(() => {
      let r1 = Math.floor(Math.random() * faces) + 1;
      let r2 = Math.floor(Math.random() * faces) + 1;
      let selected = r1;

      if (selectedDice === 'd20') {
        if (advantageMode === 'advantage') selected = Math.max(r1, r2);
        if (advantageMode === 'disadvantage') selected = Math.min(r1, r2);
      }

      const total = selected + modifier;
      const result: RollResult = {
        dice: selectedDice,
        rolls: advantageMode !== 'normal' && selectedDice === 'd20' ? [r1, r2] : [r1],
        selectedRoll: selected,
        modifier,
        total,
        mode: advantageMode,
        timestamp: Date.now(),
      };

      setLastRoll(result);
      setIsRolling(false);
    }, 250);
  };

  if (mode === 'modal' && !isOpen) return null;

  const content = (
    <div className="space-y-4 text-foreground">
      {/* Dice Selection */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Seleziona Dado
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DICE_FACES) as DiceType[]).map((dice) => (
            <button
              key={dice}
              type="button"
              onClick={() => setSelectedDice(dice)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                selectedDice === dice
                  ? 'bg-accent text-accent-foreground shadow-[0_0_10px_rgba(var(--color-accent),0.4)] scale-105'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground'
              }`}
            >
              {dice.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Advantage / Disadvantage for d20 */}
      {selectedDice === 'd20' && (
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Modalità d20
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAdvantageMode('normal')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                advantageMode === 'normal'
                  ? 'bg-accent/20 border border-accent text-accent'
                  : 'bg-muted/30 border border-transparent text-muted-foreground hover:bg-muted/50'
              }`}
            >
              Normale
            </button>
            <button
              type="button"
              onClick={() => setAdvantageMode('advantage')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                advantageMode === 'advantage'
                  ? 'bg-emerald-950/60 border border-emerald-500 text-emerald-400'
                  : 'bg-muted/30 border border-transparent text-muted-foreground hover:bg-muted/50'
              }`}
            >
              Vantaggio
            </button>
            <button
              type="button"
              onClick={() => setAdvantageMode('disadvantage')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                advantageMode === 'disadvantage'
                  ? 'bg-rose-950/60 border border-rose-500 text-rose-400'
                  : 'bg-muted/30 border border-transparent text-muted-foreground hover:bg-muted/50'
              }`}
            >
              Svantaggio
            </button>
          </div>
        </div>
      )}

      {/* Modifier Input */}
      <div className="flex items-center justify-between gap-4 bg-background/40 p-2.5 rounded-xl border border-border/50">
        <span className="text-xs font-bold text-muted-foreground uppercase">Modificatore</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModifier((prev) => prev - 1)}
            className="w-7 h-7 rounded-lg bg-secondary hover:bg-accent hover:text-accent-foreground text-foreground font-bold flex items-center justify-center"
          >
            -
          </button>
          <span className="w-10 text-center font-mono font-bold text-base text-accent">
            {modifier >= 0 ? `+${modifier}` : modifier}
          </span>
          <button
            type="button"
            onClick={() => setModifier((prev) => prev + 1)}
            className="w-7 h-7 rounded-lg bg-secondary hover:bg-accent hover:text-accent-foreground text-foreground font-bold flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Roll Action Button */}
      <button
        type="button"
        onClick={rollDice}
        disabled={isRolling}
        className="w-full py-3 bg-accent text-accent-foreground font-bold text-base rounded-xl shadow-lg hover:bg-accent-light transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
      >
        <SparklesIcon className="w-5 h-5" />
        {isRolling ? 'Lancio in corso...' : `Lancia ${selectedDice.toUpperCase()}`}
      </button>

      {/* Result Display */}
      {lastRoll && (
        <div className="p-4 bg-background/80 rounded-xl border border-accent/40 text-center space-y-1 animate-fadeIn">
          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Risultato</div>
          <div className="text-4xl font-black font-mono text-accent drop-shadow-[0_0_12px_rgba(var(--color-accent),0.6)]">
            {lastRoll.total}
          </div>
          <div className="text-xs text-muted-foreground">
            Dado: <span className="font-mono text-foreground font-semibold">{lastRoll.selectedRoll}</span>
            {lastRoll.rolls.length > 1 && (
              <span className="text-[10px] ml-1">({lastRoll.rolls.join(', ')})</span>
            )}
            {lastRoll.modifier !== 0 && (
              <span> | Mod: <span className="font-mono text-foreground font-semibold">{lastRoll.modifier >= 0 ? `+${lastRoll.modifier}` : lastRoll.modifier}</span></span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Render as Modal Popover
  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-cinzel font-bold text-accent flex items-center gap-2">
              <SparklesIcon className="w-5 h-5" /> Dice Roller
            </h3>
            {onClose && (
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
          {content}
        </div>
      </div>
    );
  }

  // Render as Floating Bottom Dock
  return (
    <div className="fixed bottom-0 right-4 z-40 max-w-sm w-[calc(100%-2rem)] sm:w-80 shadow-2xl transition-all duration-300">
      <div className="bg-card/95 backdrop-blur-md border border-accent/40 rounded-t-2xl overflow-hidden shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full px-4 py-3 bg-accent/15 hover:bg-accent/25 flex items-center justify-between text-accent font-bold text-sm transition-all"
        >
          <div className="flex items-center gap-2 font-cinzel">
            <SparklesIcon className="w-4 h-4" /> Dice Roller
          </div>
          {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
        </button>
        {isExpanded && <div className="p-4">{content}</div>}
      </div>
    </div>
  );
};
