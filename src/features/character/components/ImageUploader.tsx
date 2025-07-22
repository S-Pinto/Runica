import React, { useState, useRef } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { uploadImageBlob, compressImage } from '../../../../services/storageService';

interface ImageUploaderProps {
    characterId: string;
    onUploadSuccess: (imageUrl: string) => void;
    onUploadError: (error: Error) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ characterId, onUploadSuccess, onUploadError }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const cropperRef = useRef<ReactCropperElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setIsLoading(true);
            try {
                // Prima comprimiamo l'immagine per renderla più gestibile
                const compressedFile = await compressImage(file);
                
                // Poi creiamo un URL dati per mostrarla nel cropper
                const reader = new FileReader();
                reader.onload = () => {
                    setImageSrc(reader.result as string);
                    setIsLoading(false);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error(error);
                onUploadError(error instanceof Error ? error : new Error('Image processing failed'));
                setIsLoading(false);
            }
        }
    };

    const handleUpload = () => {
        if (!cropperRef.current?.cropper) {
            return;
        }
        setIsLoading(true);

        // Otteniamo l'immagine ritagliata come un Blob
        cropperRef.current.cropper.getCroppedCanvas().toBlob(async (blob) => {
            if (!blob) {
                setIsLoading(false);
                onUploadError(new Error('Could not get cropped image.'));
                return;
            }

            try {
                // Carichiamo il blob e otteniamo l'URL
                const downloadURL = await uploadImageBlob(blob, characterId);
                onUploadSuccess(downloadURL);
                setImageSrc(null); // Resettiamo la vista dopo l'upload
            } catch (error) {
                onUploadError(error instanceof Error ? error : new Error('Upload failed'));
            } finally {
                setIsLoading(false);
            }
        }, 'image/jpeg', 0.9); // Specifichiamo formato e qualità
    };

    return (
        <div className="my-4 p-4 border border-zinc-700 rounded-lg bg-zinc-800">
            <h3 className="text-lg font-cinzel mb-2">Cambia Immagine Personaggio</h3>
            {!imageSrc ? (
                <div>
                    <label htmlFor="image-upload" className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                        Seleziona un'immagine
                    </label>
                    <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    {isLoading && <p className="mt-2 text-zinc-400">Elaborazione immagine...</p>}
                </div>
            ) : (
                <div>
                    <Cropper
                        ref={cropperRef}
                        src={imageSrc}
                        style={{ height: 400, width: '100%' }}
                        // Opzioni di Cropper.js
                        aspectRatio={1 / 1} // Per una foto profilo quadrata
                        guides={false}
                        viewMode={1}
                        autoCropArea={0.8}
                        movable={true}
                        zoomable={true}
                        background={false}
                    />
                    <div className="mt-4 flex gap-2">
                        <button 
                            onClick={handleUpload} 
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-zinc-600 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Caricamento...' : 'Salva Ritaglio'}
                        </button>
                        <button 
                            onClick={() => setImageSrc(null)} 
                            disabled={isLoading}
                            className="bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Annulla
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};