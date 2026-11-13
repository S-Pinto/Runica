import React, { useState, useRef } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { PhotoIcon, UploadIcon } from '../../../components/ui/icons';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
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
                console.error('Image processing failed:', error);
                setError('Non riesco a leggere questa immagine. Prova con un altro file.');
                setIsProcessing(false);
            }
        }
    };

    const handleCrop = async () => {
        if (!cropperRef.current?.cropper) {
            setError('Ritaglio non disponibile. Chiudi e riprova.');
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
            console.error('Image upload failed:', err);
            setError('Caricamento non riuscito. Controlla la connessione e riprova.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={handleClose}
            title="Carica immagine"
            icon={<PhotoIcon />}
            footer={
                <>
                    <Button variant="ghost" onClick={handleClose} disabled={isProcessing}>Annulla</Button>
                    <Button onClick={handleCrop} disabled={isProcessing || !imageSrc}>
                        <UploadIcon className="h-4 w-4" />
                        {isProcessing && imageSrc ? 'Salvataggio…' : 'Salva il ritaglio'}
                    </Button>
                </>
            }
        >
            {!imageSrc ? (
                <label
                    htmlFor="image-upload-input"
                    className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong/60 px-6 py-10 text-center transition-colors duration-150 focus-within:border-accent hover:border-accent"
                >
                    <PhotoIcon className="h-10 w-10 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{isProcessing ? 'Elaborazione…' : 'Scegli un\'immagine'}</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG o WEBP. Poi la ritagli in un quadrato.</span>
                    <input id="image-upload-input" type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                </label>
            ) : (
                <Cropper
                    ref={cropperRef}
                    src={imageSrc}
                    style={{ height: 'min(360px, 50dvh)', width: '100%' }}
                    aspectRatio={1 / 1}
                    guides={false}
                    viewMode={1}
                    autoCropArea={0.8}
                    movable={true}
                    zoomable={true}
                    background={false}
                    className="overflow-hidden rounded-xl bg-background"
                />
            )}
            {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        </Modal>
    );
};
