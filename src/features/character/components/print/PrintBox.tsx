import type { CSSProperties, ReactNode } from 'react';

/**
 * Riquadro con cornice dagli angoli smussati a 45°: linea scura esterna, filetto interno grigio perla.
 * Le quattro fasce annidate (.box > .bx1 > .bx2 > .bx3) sono ritagliate con clip-path (vedi printStyles).
 */
export const Box = ({ title, className = '', style, children }: { title?: string; className?: string; style?: CSSProperties; children: ReactNode }) => (
    <div className={`box ${className}`} style={style}>
        <div className="bx1"><div className="bx2"><div className="bx3">
            {title && <div className="box-title"><span>{title}</span></div>}
            {children}
        </div></div></div>
    </div>
);
