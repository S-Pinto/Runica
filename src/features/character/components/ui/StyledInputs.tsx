import React, { ReactNode } from 'react';

interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    subLabel?: string;
    icon?: ReactNode;
}

export const StyledInput: React.FC<StyledInputProps> = ({ label, subLabel, icon, className = '', ...props }) => {
    return (
        <div className={`space-y-1.5 ${className}`}>
            <div className="flex justify-between items-baseline">
                <label htmlFor={props.id || props.name} className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                    {label}
                </label>
                {subLabel && <span className="text-[10px] text-muted-foreground/60 italic">{subLabel}</span>}
            </div>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    {...props}
                    className={`
                        w-full bg-background/50 backdrop-blur-sm 
                        border border-border/50 rounded-xl 
                        py-2.5 px-3 ${icon ? 'pl-10' : ''}
                        text-foreground placeholder:text-muted-foreground/40
                        shadow-sm transition-all duration-200
                        focus:ring-2 focus:ring-accent/20 focus:border-accent
                        hover:border-accent/30 hover:bg-background/80
                        ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                />
            </div>
        </div>
    );
};

interface StyledTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    subLabel?: string;
}

export const StyledTextArea: React.FC<StyledTextAreaProps> = ({ label, subLabel, className = '', ...props }) => {
    return (
        <div className={`space-y-1.5 flex flex-col h-full ${className}`}>
            <div className="flex justify-between items-baseline">
                <label htmlFor={props.id || props.name} className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                    {label}
                </label>
                {subLabel && <span className="text-[10px] text-muted-foreground/60 italic">{subLabel}</span>}
            </div>
            <textarea
                {...props}
                className={`
                    w-full flex-grow bg-background/50 backdrop-blur-sm 
                    border border-border/50 rounded-xl 
                    p-3 text-foreground placeholder:text-muted-foreground/40
                    shadow-sm transition-all duration-200
                    focus:ring-2 focus:ring-accent/20 focus:border-accent
                    hover:border-accent/30 hover:bg-background/80
                    resize-y min-h-[100px]
                `}
            />
        </div>
    );
};

interface StyledSectionProps {
    title?: string;
    children: ReactNode;
    className?: string;
    action?: ReactNode;
}

export const StyledSection: React.FC<StyledSectionProps> = ({ title, children, className = '', action }) => {
    return (
        <div className={`bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-lg shadow-black/5 ${className}`}>
            {title && (
                <div className="flex justify-between items-center mb-4 border-b border-border/30 pb-2">
                    <h3 className="text-lg font-cinzel text-accent drop-shadow-sm">{title}</h3>
                    {action}
                </div>
            )}
            {children}
        </div>
    );
};
