
'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';
import { uploadModelImage, deleteModelImage } from '@/lib/actions/storage';
import { ImageCropDialog } from './ImageCropDialog'; // Importar el nuevo componente

interface CompCardManagerProps {
    modelId: string;
    initialCoverUrl?: string | null;
    initialPortfolioUrl?: string | null;
    initialCompCardUrls?: (string | null)[];
    initialCoverPath?: string | null;
    initialPortfolioPath?: string | null;
    initialCompCardPaths?: (string | null)[];
}

// Interfaz para el estado del recorte
interface CropState {
  imageSrc: string | null;
  aspect: number;
  uploadType: 'cover' | 'comp-card' | 'portfolio';
  slotIndex?: number;
}

// Componente reutilizable para cada slot de foto
const PhotoSlot = ({ className, imageUrl, onFileSelect, onDelete, label, isUploading }: {
    className?: string; imageUrl: string | null; onFileSelect: (file: File) => void;
    onDelete: () => void; label: string; isUploading: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false); // Estado para el drag & drop

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
    if (event.target) event.target.value = '';
  };
  
  // --- INICIO: LÓGICA DE DRAG & DROP ---
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Previene el comportamiento por defecto del navegador
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Solo procesamos si es una imagen
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      } else {
        toast.error('Archivo no válido', { description: 'Por favor, arrastra un archivo de imagen.' });
      }
    }
  };
  // --- FIN: LÓGICA DE DRAG & DROP ---

  return (
    <div 
        className={cn(
            "relative group bg-muted/50 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden transition-all",
            isDragging && "border-primary ring-2 ring-primary ring-offset-2", // Estilo cuando se arrastra sobre el elemento
            className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      {imageUrl ? (
        <>
          <Image src={imageUrl} alt={label} fill className="object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button variant="destructive" size="icon" onClick={onDelete} disabled={isUploading}>
                <Trash2 />
                <span className="sr-only">Borrar {label}</span>
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center p-4">
            <input type="file" ref={inputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/webp" className="hidden" />
            <Button variant="ghost" className="h-auto p-4 flex flex-col items-center justify-center" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                {isUploading
                    ? <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                    : <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                }
                <span className="text-label-12 font-normal text-muted-foreground">
                    {isUploading ? 'Subiendo...' : (isDragging ? 'Suelta la imagen aquí' : label)}
                </span>
            </Button>
        </div>
      )}
    </div>
  );
};


export function CompCardManager({
    modelId,
    initialCoverUrl = null,
    initialPortfolioUrl = null,
    initialCompCardUrls = [null, null, null, null],
    initialCoverPath = null,
    initialPortfolioPath = null,
    initialCompCardPaths = [null, null, null, null],
}: CompCardManagerProps) {
    const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl);
    const [compCardUrls, setCompCardUrls] = useState<(string | null)[]>(Array(4).fill(null).map((_, i) => initialCompCardUrls[i] || null));
    const [portfolioUrl, setPortfolioUrl] = useState<string | null>(initialPortfolioUrl);

    const [coverPath, setCoverPath] = useState<string | null>(initialCoverPath);
    const [compCardPaths, setCompCardPaths] = useState<(string | null)[]>(Array(4).fill(null).map((_, i) => initialCompCardPaths[i] || null));
    const [portfolioPath, setPortfolioPath] = useState<string | null>(initialPortfolioPath);
    
    // --- NUEVOS ESTADOS ---
    const [uploadingState, setUploadingState] = useState({ cover: false, compCards: [false, false, false, false], portfolio: false });
    const [cropState, setCropState] = useState<CropState | null>(null);

    // Abre el diálogo de recorte cuando se selecciona un archivo
    const handleFileSelect = (file: File, uploadType: CropState['uploadType'], aspect: number, slotIndex?: number) => {
        const reader = new FileReader();
        reader.onload = () => {
            setCropState({
                imageSrc: reader.result as string,
                aspect,
                uploadType,
                slotIndex,
            });
        };
        reader.readAsDataURL(file);
    };

    // Cierra el diálogo de recorte
    const handleCropDialogClose = () => {
        setCropState(null);
    };

    // --- FUNCIÓN DE SUBIDA (MODIFICADA) ---
    // Ahora se llama cuando el recorte se completa
    const handleUpload = async (file: File) => {
        if (!cropState) return;

        const { uploadType, slotIndex } = cropState;
        const category = uploadType === 'comp-card' ? 'Contraportada' : (uploadType === 'cover' ? 'Portada' : 'Portfolio');
        
        if (uploadType === 'cover') setUploadingState(p => ({ ...p, cover: true }));
        else if (uploadType === 'portfolio') setUploadingState(p => ({ ...p, portfolio: true }));
        else if (slotIndex !== undefined) setUploadingState(p => {
            const newCompCards = [...p.compCards]; newCompCards[slotIndex] = true;
            return { ...p, compCards: newCompCards };
        });

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('modelId', modelId);
            formData.append('category', category);
            if (slotIndex !== undefined) {
                formData.append('slotIndex', String(slotIndex));
            }
            
            const result = await uploadModelImage(formData);

            if (!result || !result.success) {
              throw new Error(result.error || "La subida falló.");
            }
            
            toast.success('Imagen subida y guardada.');
            
            const { path: returnedPath, publicUrl } = result;

            if (category === 'Portada') {
                if (publicUrl) setCoverUrl(publicUrl);
                if (returnedPath) setCoverPath(returnedPath);
            } else if (category === 'Portfolio') {
                if (publicUrl) setPortfolioUrl(publicUrl);
                if (returnedPath) setPortfolioPath(returnedPath);
            } else if (category === 'Contraportada' && slotIndex !== undefined) {
                if (publicUrl) setCompCardUrls(prev => {
                    const copy = [...prev]; copy[slotIndex] = publicUrl; return copy;
                });
                if (returnedPath) setCompCardPaths(prev => {
                    const copy = [...prev]; copy[slotIndex] = returnedPath; return copy;
                });
            }

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Ocurrió un error.';
            toast.error('Error al subir la imagen', { description: message });
        } finally {
             if (uploadType === 'cover') setUploadingState(p => ({ ...p, cover: false }));
             else if (uploadType === 'portfolio') setUploadingState(p => ({ ...p, portfolio: false }));
             else if (slotIndex !== undefined) setUploadingState(p => {
                 const newCompCards = [...p.compCards]; newCompCards[slotIndex] = false;
                 return { ...p, compCards: newCompCards };
             });
        }
    };

    const handleDelete = async (type: 'cover' | 'comp-card' | 'portfolio', slotIndex?: number) => {
        let filePathToDelete: string | null = null;
        const category = type === 'comp-card' ? 'Contraportada' : (type === 'cover' ? 'Portada' : 'Portfolio');

        if (category === 'Portada') {
            filePathToDelete = coverPath;
        } else if (category === 'Portfolio') {
            filePathToDelete = portfolioPath;
        } else if (slotIndex !== undefined && slotIndex >= 0 && slotIndex < 4) {
            filePathToDelete = compCardPaths[slotIndex];
        }

        if (!filePathToDelete) {
            toast.error('No se encontró la imagen para eliminar. Refresca la página.');
            return;
        }

        try {
            const res = await deleteModelImage(modelId, filePathToDelete, category, slotIndex);

            if (!res.success) {
                toast.error(res.error || 'Error desconocido al eliminar.');
            } else {
                toast.success('Imagen eliminada.');
                if (category === 'Portada') {
                    setCoverUrl(null); setCoverPath(null);
                } else if (category === 'Portfolio') {
                    setPortfolioUrl(null); setPortfolioPath(null);
                } else if (category === 'Contraportada' && slotIndex !== undefined) {
                    setCompCardUrls(prev => { const copy = [...prev]; copy[slotIndex] = null; return copy; });
                    setCompCardPaths(prev => { const copy = [...prev]; copy[slotIndex] = null; return copy; });
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Ocurrió un error.';
            toast.error('Error al eliminar la imagen', { description: message });
        }
    };

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>Imágenes del Talento</CardTitle>
                <CardDescription>Sube y administra las imágenes de portada, portafolio y contraportada.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div>
                            <span className="text-label-14 text-muted-foreground mb-2 block">Portada (Slider)</span>
                            <PhotoSlot
                                className="aspect-[3/4]"
                                imageUrl={coverUrl}
                                onFileSelect={(file) => handleFileSelect(file, 'cover', 3/4)}
                                onDelete={() => handleDelete('cover')}
                                label="Subir Portada"
                                isUploading={uploadingState.cover}
                            />
                        </div>
                        <div>
                            <span className="text-label-14 text-muted-foreground mb-2 block">Contraportada (4 Fotos)</span>
                            <div className="grid grid-cols-2 gap-4">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <PhotoSlot
                                        key={index}
                                        className="aspect-square"
                                        imageUrl={compCardUrls[index]}
                                        onFileSelect={(file) => handleFileSelect(file, 'comp-card', 1/1, index)}
                                        onDelete={() => handleDelete('comp-card', index)}
                                        label={`Foto ${index + 1}`}
                                        isUploading={uploadingState.compCards[index]}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                     <div>
                        <span className="text-label-14 text-muted-foreground mb-2 block">Portafolio (Imagen Principal Horizontal)</span>
                        <PhotoSlot
                            className="aspect-[11/8.5] max-h-64"
                            imageUrl={portfolioUrl}
                            onFileSelect={(file) => handleFileSelect(file, 'portfolio', 11/8.5)}
                            onDelete={() => handleDelete('portfolio')}
                            label="Subir Imagen de Portafolio"
                            isUploading={uploadingState.portfolio}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
        
        {cropState && (
            <ImageCropDialog
                imageSrc={cropState.imageSrc}
                aspect={cropState.aspect}
                onCropComplete={handleUpload}
                onClose={handleCropDialogClose}
            />
        )}
        </>
    );
}

