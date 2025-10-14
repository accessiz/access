
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Model } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { uploadModelImage } from '../../lib/actions/storage';

interface CompCardManagerProps {
  model: Model;
}

const PhotoSlot = ({ 
    className, 
    imageUrl, 
    onFileSelect, 
    onDelete, 
    label,
    isUploading,
}: { 
    className?: string; 
    imageUrl: string | null; 
    onFileSelect: (file: File) => void;
    onDelete: () => void;
    label: string;
    isUploading: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    event.target.value = ''; // Limpiar el input para permitir subir el mismo archivo de nuevo
  };

  return (
    <div className={cn("relative group bg-muted/50 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden transition-all", className)}>
      {imageUrl ? (
        <>
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button variant="destructive" size="icon" onClick={onDelete} disabled={isUploading}>
              <Trash2 />
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center p-4">
            <input
                type="file"
                ref={inputRef}
                onChange={handleFileChange}
                accept="image/jpeg, image/png, image/webp, image/gif"
                className="hidden"
            />
            <Button variant="ghost" className="h-auto p-4 flex flex-col items-center justify-center" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                {isUploading ? (
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                ) : (
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                )}
                <span className="text-xs font-normal text-muted-foreground">{isUploading ? 'Subiendo...' : label}</span>
            </Button>
        </div>
      )}
    </div>
  );
};

export const CompCardManager = ({ model }: CompCardManagerProps) => {
    const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
    const [compCardPhotos, setCompCardPhotos] = useState<(string | null)[]>([null, null, null, null]);
    const [uploadingState, setUploadingState] = useState({ cover: false, compCard: [false, false, false, false] });

    // TODO: Lógica para obtener las URLs existentes de Supabase al cargar
    useEffect(() => {
        // Aquí se poblarían las URLs de las fotos existentes
    }, [model.id]);

    const handleUpload = async (file: File, type: 'cover' | 'comp-card', slotIndex?: number) => {
        if (!model.id || !model.gender) {
            toast.error("Faltan datos del modelo", { description: "No se puede subir la imagen sin ID o género."});
            return;
        }

        const modelInfo = {
            modelId: model.id,
            gender: model.gender,
            photoType: type === 'cover' ? 'Portada' : 'Contraportada',
            slotIndex: slotIndex
        };

        if (type === 'cover') {
            setUploadingState(prev => ({ ...prev, cover: true }));
        } else if (slotIndex !== undefined) {
            setUploadingState(prev => {
                const newCompCard = [...prev.compCard];
                newCompCard[slotIndex] = true;
                return { ...prev, compCard: newCompCard };
            });
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('modelInfo', JSON.stringify(modelInfo));

        const result = await uploadModelImage(formData);

        if (result.success && result.url) {
            toast.success('Imagen subida correctamente.');
            const urlWithTimestamp = `${result.url}?t=${new Date().getTime()}`;
            if (type === 'cover') {
                setCoverPhotoUrl(urlWithTimestamp);
            } else if (slotIndex !== undefined) {
                const newPhotos = [...compCardPhotos];
                newPhotos[slotIndex] = urlWithTimestamp;
                setCompCardPhotos(newPhotos);
            }
        } else {
            toast.error('Error al subir la imagen', { description: result.error });
        }

         if (type === 'cover') {
            setUploadingState(prev => ({ ...prev, cover: false }));
        } else if (slotIndex !== undefined) {
            setUploadingState(prev => {
                const newCompCard = [...prev.compCard];
                newCompCard[slotIndex] = false;
                return { ...prev, compCard: newCompCard };
            });
        }
    };

    // TODO: Lógica para eliminar fotos
    const handleDelete = async (type: 'cover' | 'comp-card', slotIndex?: number) => {
        console.log('Eliminar:', type, slotIndex);
        // Aquí llamarías a una server action para borrar el archivo de Storage
        // y luego actualizas el estado local a null.
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Comp Card</CardTitle>
                <CardDescription>
                    Sube y administra las imágenes de portada y contraportada.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                         <span className="text-sm font-medium text-muted-foreground">Portada</span>
                        <PhotoSlot
                            className="aspect-[3/4]"
                            imageUrl={coverPhotoUrl}
                            onFileSelect={(file) => handleUpload(file, 'cover')}
                            onDelete={() => handleDelete('cover')}
                            label="Subir Portada"
                            isUploading={uploadingState.cover}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Contraportada</span>
                        <div className="grid grid-cols-2 gap-4">
                            {compCardPhotos.map((url, index) => (
                                <PhotoSlot
                                    key={index}
                                    className="aspect-square"
                                    imageUrl={url}
                                    onFileSelect={(file) => handleUpload(file, 'comp-card', index)}
                                    onDelete={() => handleDelete('comp-card', index)}
                                    label={`Foto ${index + 1}`}
                                    isUploading={uploadingState.compCard[index]}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
