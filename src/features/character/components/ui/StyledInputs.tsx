import React, { ReactNode } from 'react';
import { fieldControlClass } from '../../../../components/ui/field';

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
                    className={`${fieldControlClass} ${props.type === 'number' ? 'no-spinner font-mono' : ''} ${icon ? 'pl-10' : ''}`}
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
            <textarea {...props} id={id} className={`${fieldControlClass} min-h-[100px] flex-grow resize-y leading-relaxed`} />
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
            <select {...props} id={id} className={fieldControlClass}>{children}</select>
        </div>
    );
};

interface StyledSectionProps {
    title?: string;
    children: ReactNode;
    className?: string;
    action?: ReactNode;
}

/**
 * Sezione dell'editor: card piatta con bordo. Il titolo è inciso in Cinzel e
 * un filo lo prolunga fino al margine (o fino all'azione a destra).
 */
export const StyledSection: React.FC<StyledSectionProps> = ({ title, children, className = '', action }) => (
    <section aria-label={title} className={`rounded-2xl border border-border bg-card p-4 sm:p-5 ${className}`}>
        {title && (
            <div className="mb-4 flex min-h-10 items-center gap-3">
                <h3 className="min-w-0 truncate font-cinzel text-title text-accent">{title}</h3>
                <span aria-hidden className="h-px min-w-4 flex-1 bg-border" />
                {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
            </div>
        )}
        {children}
    </section>
);
