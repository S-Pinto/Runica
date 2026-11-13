import { ReactNode } from 'react';

type Glyph = 'diamond' | 'knot' | 'notch';

interface RuneDividerProps {
  /** `diamond`: rombo con punto inciso (predefinito). `knot`: nodo a clessidra fra due rombi, per gli stacchi maggiori. */
  glyph?: Glyph;
  className?: string;
}

const GLYPHS: Record<Glyph, { width: number; path: ReactNode }> = {
  diamond: {
    width: 28,
    path: (
      <>
        <path d="M14 1.5 19.5 7 14 12.5 8.5 7Z" />
        <path d="M14 5.2 15.8 7 14 8.8 12.2 7Z" fill="currentColor" stroke="none" />
        <path d="M3 7h2.5M22.5 7H25" />
      </>
    ),
  },
  // Incavo centrale: una tacca a V che scende dal filo, con un punto al fondo.
  notch: {
    width: 36,
    path: (
      <>
        <path d="M2 7h10l6 5 6-5h10" />
        <path d="M18 9.6 19.6 11.2 18 12.8 16.4 11.2Z" fill="currentColor" stroke="none" />
      </>
    ),
  },
  knot: {
    width: 44,
    path: (
      <>
        <path d="M16 2.5v9l12-9v9Z" />
        <path d="M6 4.5 8.5 7 6 9.5 3.5 7ZM38 4.5 40.5 7 38 9.5 35.5 7Z" fill="currentColor" stroke="none" />
      </>
    ),
  },
};

/**
 * Separatore inciso fra le sezioni principali di una pagina: un filo da 1px
 * con un glifo geometrico al centro. È decorazione: i lettori di schermo lo
 * ignorano. Non si usa dentro una card (lì basta il filo del titolo).
 */
export const RuneDivider = ({ glyph = 'diamond', className = '' }: RuneDividerProps) => {
  const { width, path } = GLYPHS[glyph];
  return (
    <div aria-hidden className={`flex items-center gap-3 ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border-strong/60" />
      <svg
        viewBox={`0 0 ${width} 14`}
        width={width}
        height={14}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinejoin="miter"
        className="shrink-0 text-accent"
      >
        {path}
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border-strong/60" />
    </div>
  );
};
