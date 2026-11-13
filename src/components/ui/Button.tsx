import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'destructive-outline';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-lg';

// Il bagliore dell'accento è una risposta a hover/focus, mai uno stato di riposo.
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-foreground shadow-rest hover:bg-accent-dark hover:shadow-glow',
  secondary: 'bg-card text-text border border-border-strong/60 hover:border-accent/70 hover:text-accent',
  ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
  destructive: 'bg-destructive text-destructive-foreground shadow-rest hover:bg-destructive/90',
  'destructive-outline': 'border border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/10',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-sm gap-2 rounded-2xl',
  icon: 'h-10 w-10 rounded-xl',
  // Bersaglio da 44px per i controlli usati col pollice (barra superiore, vista di gioco).
  'icon-lg': 'h-11 w-11 rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-soft active:scale-[0.97] active:duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
