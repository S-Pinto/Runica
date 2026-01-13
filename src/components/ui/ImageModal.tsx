import React, { useEffect } from 'react';
import { XMarkIcon } from './icons';

interface ImageModalProps {
    imageUrl: string;
    altText: string;
    onClose: () => void;
}

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
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
            aria-modal="true"
            role="dialog"
        >
            <div className="relative max-w-[95vw] max-h-[95vh] w-auto h-auto flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                <img
                    src={imageUrl}
                    alt={altText}
                    className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
                />
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2.5 transition-all backdrop-blur-md border border-white/10"
                    aria-label="Close image view"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};