import React, { ReactNode } from 'react';
import { fieldControlOnTileClass } from '../../../../components/ui/field';
import { PlaySection } from '../play-view/PlaySection';

interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    subLabel?: string;
    icon?: ReactNode;
}

const FieldHeader = ({ htmlFor, label, subLabel }: { htmlFor?: string; label: string; subLabel?: string }) => (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-label uppercase text-muted-foreground">{label}</label>
        {subLabel && <span className="text-xs text-muted-foreground">{subLabel}</span>}
    </div>
);

export const StyledInput: React.FC<StyledInputProps> = ({ label, subLabel, icon, className = '', ...props }) => {
    const id = props.id || props.name;
    return (
        <div className={className}>
            <FieldHeader htmlFor={id} label={label} subLabel={subLabel} />
            <div className="group relative">
                {icon && (
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-150 group-focus-within:text-accent">
                        {icon}
                    </div>
                )}
                <input
                    {...props}
                    id={id}
                    className={`${fieldControlOnTileClass} ${props.type === 'number' ? 'no-spinner font-mono' : ''} ${icon ? 'pl-10' : ''}`}
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
    const id = props.id || props.name;
    return (
        <div className={`flex flex-col ${className}`}>
            <FieldHeader htmlFor={id} label={label} subLabel={subLabel} />
            <textarea {...props} id={id} className={`${fieldControlOnTileClass} min-h-[100px] flex-grow resize-y leading-relaxed`} />
        </div>
    );
};

interface StyledSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    subLabel?: string;
}

export const StyledSelect: React.FC<StyledSelectProps> = ({ label, subLabel, className = '', children, ...props }) => {
    const id = props.id || props.name;
    return (
        <div className={className}>
            <FieldHeader htmlFor={id} label={label} subLabel={subLabel} />
            <select {...props} id={id} className={fieldControlOnTileClass}>{children}</select>
        </div>
    );
};

interface StyledSectionProps {
    title?: string;
    /** Icona accanto al titolo, come nei pannelli della vista di gioco. */
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
    action?: ReactNode;
}

/**
 * Sezione dell'editor: stesso guscio della vista di gioco (`PlaySection`, tessera
 * `.tile` senza bordo, titolo in maiuscoletto con icona e azione a destra).
 */
export const StyledSection: React.FC<StyledSectionProps> = ({ title, icon, children, className = '', action }) => (
    <PlaySection title={title} icon={icon} aside={action} className={className}>
        {children}
    </PlaySection>
);
