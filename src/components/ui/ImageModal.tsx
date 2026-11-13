import React, { useEffect } from 'react';
import { XMarkIcon } from './icons';

interface ImageModalProps {
    imageUrl: string;
    altText: string;
    onClose: () => void;
}

/**
 * Visore a tutto schermo per un'immagine. Il fondo resta nero in ogni tema
 * (eccezione documentata in DESIGN.md): un'immagine si guarda sul nero.
 */
export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, altText, onClose }) => {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!imageUrl) return null;

    return (
        <div
            className="fixed inset-0 z-modal flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fadeIn"
            onClick={handleBackdropClick}
            aria-modal="true"
            aria-label={altText}
            role="dialog"
        >
            <img
                src={imageUrl}
                alt={altText}
                className="max-h-[92dvh] max-w-full rounded-xl object-contain shadow-floating animate-popIn"
            />
            <button
                type="button"
                onClick={onClose}
                autoFocus
                className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/80 transition-colors duration-150 hover:bg-black/80 hover:text-white focus-visible:outline-white"
                aria-label="Chiudi immagine"
            >
                <XMarkIcon className="h-6 w-6" />
            </button>
        </div>
    );
};
