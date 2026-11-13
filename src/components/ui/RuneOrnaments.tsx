interface OrnamentProps {
  className?: string;
}

/**
 * Cerchio astrolabico: anelli sottili con tacche e quattro rombi cardinali.
 * Ruota lentissimo (60s, `.rune-spin`); è filigrana, quindi nascosto ai
 * lettori di schermo e fermo con "riduci movimento".
 */
export const AstrolabeRing = ({ className = '' }: OrnamentProps) => (
  <svg
    aria-hidden
    viewBox="0 0 200 200"
    fill="none"
    stroke="currentColor"
    strokeWidth={0.75}
    className={`rune-spin pointer-events-none ${className}`}
  >
    <circle cx="100" cy="100" r="96" />
    <circle cx="100" cy="100" r="84" strokeDasharray="1.5 5.5" />
    <circle cx="100" cy="100" r="62" opacity="0.7" />
    <path d="M100 4v14M100 182v14M4 100h14M182 100h14" />
    <path d="M100 38 112 100 100 162 88 100Z" opacity="0.55" />
    <path d="M38 100 100 88 162 100 100 112Z" opacity="0.55" />
    <path d="M100 91 109 100 100 109 91 100Z" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * Glifi angolari per le cornici: quattro angoli a "L" con un rombo. Il
 * contenitore deve essere `relative`; compaiono con `opacity` dal genitore
 * (`group-hover`, `group-focus-visible` o stato attivo).
 */
export const CornerGlyphs = ({ className = '' }: OrnamentProps) => {
  const corner = (pos: string, rotate: number) => (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      className={`absolute ${pos}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path d="M1 13V3a2 2 0 0 1 2-2h10" />
      <path d="M5.5 5.5 7.5 7.5 5.5 9.5 3.5 7.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
  return (
    <span aria-hidden className={`rune-corners pointer-events-none absolute inset-0 text-accent ${className}`}>
      {corner('left-1.5 top-1.5', 0)}
      {corner('right-1.5 top-1.5', 90)}
      {corner('bottom-1.5 right-1.5', 180)}
      {corner('bottom-1.5 left-1.5', 270)}
    </span>
  );
};
