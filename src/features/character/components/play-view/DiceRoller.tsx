import React, { useState } from 'react';
import { DiceIcon, ChevronDownIcon, MinusIcon, PlusIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { SegmentedControl, SegmentedOption } from '../../../../components/ui/SegmentedControl';
import { playLabelClass, playInsetClass } from './PlaySection';

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

const ADVANTAGE_MODES: SegmentedOption<AdvantageMode>[] = [
  { value: 'normal', label: 'Normale' },
  { value: 'advantage', label: 'Vantaggio', tone: 'success' },
  { value: 'disadvantage', label: 'Svantaggio', tone: 'destructive' },
];

const formatSigned = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

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
      const r1 = Math.floor(Math.random() * faces) + 1;
      const r2 = Math.floor(Math.random() * faces) + 1;
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

  // Il 20 e l'1 naturali su un d20 si leggono dal colore, senza altre decorazioni.
  const resultTone = !lastRoll || lastRoll.dice !== 'd20'
    ? 'text-foreground'
    : lastRoll.selectedRoll === 20 ? 'text-success' : lastRoll.selectedRoll === 1 ? 'text-destructive' : 'text-foreground';

  const content = (
    <div className="space-y-4">
      {/* Risultato: sempre presente, così i controlli sotto non si spostano al primo tiro. */}
      <div className={`${playInsetClass} flex min-h-[6.5rem] flex-col items-center justify-center px-4 py-3 text-center`} aria-live="polite">
        {lastRoll ? (
          <div key={lastRoll.timestamp} className="animate-popIn result-flash rounded-2xl px-4 py-1">
            <p className={`font-mono text-5xl font-bold leading-none tabular-nums ${resultTone}`}>{lastRoll.total}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {lastRoll.dice}: <span className="font-mono font-semibold text-foreground">{lastRoll.selectedRoll}</span>
              {lastRoll.rolls.length > 1 && <span className="font-mono"> (tiri {lastRoll.rolls.join(', ')})</span>}
              {lastRoll.modifier !== 0 && (
                <> · modificatore <span className="font-mono font-semibold text-foreground">{formatSigned(lastRoll.modifier)}</span></>
              )}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Scegli un dado e lancia.</p>
        )}
      </div>

      <div>
        <p className={`${playLabelClass} mb-2`}>Dado</p>
        <div role="radiogroup" aria-label="Dado" className="grid grid-cols-4 gap-2">
          {(Object.keys(DICE_FACES) as DiceType[]).map((dice) => (
            <button
              key={dice}
              type="button"
              role="radio"
              aria-checked={selectedDice === dice}
              onClick={() => setSelectedDice(dice)}
              className={`h-11 rounded-xl border font-mono text-sm font-semibold transition-[color,background-color,border-color,transform,box-shadow] duration-200 ease-soft active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                selectedDice === dice
                  ? 'border-accent bg-accent text-accent-foreground shadow-glow'
                  : 'border-border-strong/60 text-text hover:border-accent/70 hover:text-accent'
              }`}
            >
              {dice}
            </button>
          ))}
        </div>
      </div>

      {selectedDice === 'd20' && (
        <SegmentedControl label="Modalità del d20" options={ADVANTAGE_MODES} value={advantageMode} onChange={setAdvantageMode} />
      )}

      <div className="flex items-center justify-between gap-4">
        <span className={playLabelClass}>Modificatore</span>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="icon" onClick={() => setModifier((prev) => prev - 1)} aria-label="Diminuisci il modificatore">
            <MinusIcon className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-mono text-lg font-bold tabular-nums text-foreground" aria-live="polite">
            {formatSigned(modifier)}
          </span>
          <Button variant="secondary" size="icon" onClick={() => setModifier((prev) => prev + 1)} aria-label="Aumenta il modificatore">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button size="lg" onClick={rollDice} disabled={isRolling} className="w-full">
        <DiceIcon className={`h-5 w-5 ${isRolling ? 'dice-tumble' : ''}`} />
        {isRolling ? 'Lancio…' : `Lancia ${selectedDice}`}
      </Button>
    </div>
  );

  if (mode === 'modal') {
    return (
      <Modal open={isOpen} onClose={() => onClose?.()} title="Dadiera" icon={<DiceIcon />} size="sm">
        {content}
      </Modal>
    );
  }

  // Pillola flottante: chiusa è un solo pulsante, aperta mostra la dadiera sopra di lei.
  return (
    <div className="pointer-events-none fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-40 flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:w-80">
      {isExpanded && (
        <section aria-label="Dadiera" className="glass-pill pointer-events-auto max-h-[70dvh] w-full overflow-y-auto rounded-2xl p-4 animate-popIn">
          {content}
        </section>
      )}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-label="Dadiera"
        className="glass-pill pointer-events-auto flex h-14 items-center gap-3 rounded-full py-1.5 pl-1.5 pr-1.5 has-[.font-mono]:pr-4 sm:pr-5 text-sm font-semibold text-text transition-[transform,border-color,color] duration-150 ease-soft hover:border-accent/70 hover:text-accent active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_0_18px_-4px_rgb(var(--color-accent)/0.6)] ${isRolling ? 'dice-tumble' : ''}`}>
          <DiceIcon className="h-6 w-6" />
        </span>
        <span className="hidden sm:inline">Dadiera</span>
        {!isExpanded && lastRoll && (
          <span className="font-mono text-muted-foreground">{lastRoll.dice} · <span className="font-bold text-foreground">{lastRoll.total}</span></span>
        )}
        {isExpanded && <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />}
      </button>
    </div>
  );
};
