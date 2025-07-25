import React from 'react';
import { XMarkIcon } from './icons';

interface ImageModalProps {
    imageUrl: string;
    altText: string;
    onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, altText, onClose }) => {
    // Funzione per chiudere la modale quando si clicca sul backdrop
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 animate-fade-in"
            onClick={handleBackdropClick}
            aria-modal="true"
            role="dialog"
        >
            <div className="relative max-w-4xl max-h-[90vh] bg-card p-2 rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <img src={imageUrl} alt={altText} className="w-full h-full max-h-[inherit] object-contain" />
                <button onClick={onClose} className="absolute top-2 right-2 bg-card/50 text-foreground rounded-full p-2 hover:bg-destructive hover:text-white transition-colors" aria-label="Close image view">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};