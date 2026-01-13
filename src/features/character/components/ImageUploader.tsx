import React, { useState, useRef, useEffect } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { PhotoIcon, UploadIcon, XMarkIcon } from '../../../components/ui/icons';
import { compressImage } from '../../../services/storageService';

interface ImageUploaderProps {
    isOpen: boolean;
    onClose: () => void;
    onImageReady: (dataUrl: string) => Promise<void>;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ isOpen, onClose, onImageReady }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cropperRef = useRef<ReactCropperElement>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (dialog) {
            if (isOpen) {
                dialog.showModal();
            } else {
                dialog.close();
            }
        }
    }, [isOpen]);

    const resetState = () => {
        setImageSrc(null);
        setIsProcessing(false);
        setError(null);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setIsProcessing(true);
            try {
                const compressedFile = await compressImage(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                });

                const reader = new FileReader();
                reader.onload = () => {
                    setImageSrc(reader.result as string);
                    setIsProcessing(false);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Image processing failed.');
                setIsProcessing(false);
            }
        }
    };

    const handleCrop = async () => {
        if (!cropperRef.current?.cropper) {
            setError('Cropper not available.');
            return;
        }
        setIsProcessing(true);
        setError(null);

        // Get cropped image as a base64 data URL
        const dataUrl = cropperRef.current.cropper.getCroppedCanvas({
            width: 256, // Define a standard size for portraits
            height: 256,
            imageSmoothingQuality: 'high',
        }).toDataURL('image/jpeg', 0.9);

        try {
            await onImageReady(dataUrl);
            handleClose(); // Close only on success
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <dialog ref={dialogRef} onClose={handleClose} className="bg-card text-foreground p-0 rounded-lg shadow-2xl w-full max-w-md border border-border backdrop:bg-black/50">
            <header className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-cinzel text-accent">Upload Portrait</h3>
                <button onClick={handleClose} className="p-1 rounded-full hover:bg-muted transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </header>
            <div className="p-6">
                {!imageSrc ? (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-input rounded-lg p-8 text-center">
                        <PhotoIcon className="w-12 h-12 text-muted-foreground mb-2" />
                        <label htmlFor="image-upload-input" className="cursor-pointer bg-accent hover:bg-accent-dark text-accent-foreground font-bold py-2 px-4 rounded transition-colors duration-200">
                            Select an Image
                        </label>
                        <input id="image-upload-input" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        <p className="text-xs text-muted-foreground mt-2">PNG, JPG, WEBP up to 1MB.</p>
                        {isProcessing && <p className="mt-2 text-muted-foreground animate-pulse">Processing...</p>}
                    </div>
                ) : (
                    <div>
                        <Cropper
                            ref={cropperRef}
                            src={imageSrc}
                            style={{ height: 400, width: '100%' }}
                            aspectRatio={1 / 1}
                            guides={false}
                            viewMode={1}
                            autoCropArea={0.8}
                            movable={true}
                            zoomable={true}
                            background={false}
                            className="bg-background rounded-md"
                        />
                    </div>
                )}
                {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            </div>
            <footer className="flex justify-end gap-2 p-4 bg-muted/50 border-t border-border">
                <button
                    onClick={handleClose}
                    disabled={isProcessing}
                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCrop}
                    disabled={isProcessing || !imageSrc}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <UploadIcon className="w-5 h-5" />
                    {isProcessing ? 'Saving...' : 'Save Cropped Image'}
                </button>
            </footer>
        </dialog>
    );
};