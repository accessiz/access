'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';
import { fetchSafe } from '@/lib/utils/fetchSafe';

interface CompCardManagerProps {
    modelId: string;
    initialCoverUrl?: string | null;
    initialPortfolioUrl?: string | null;
    initialCompCardUrls?: (string | null)[];
    initialCoverPath?: string | null;
    initialPortfolioPath?: string | null;
    initialCompCardPaths?: (string | null)[];
}

// Componente reutilizable para cada slot de foto
const PhotoSlot = ({ className, imageUrl, onFileSelect, onDelete, label, isUploading }: {
    className?: string; imageUrl: string | null; onFileSelect: (file: File) => void;
    onDelete: () => void; label: string; isUploading: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
    if (event.target) event.target.value = '';
  };

  return (
    <div className={cn("relative group bg-muted/50 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden transition-all", className)}>
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
                <span className="text-label-12 font-normal text-muted-foreground">{isUploading ? 'Subiendo...' : label}</span>
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

        const [uploadingState, setUploadingState] = useState({ cover: false, compCards: [false, false, false, false], portfolio: false });

    const handleUpload = async (file: File, type: 'cover' | 'comp-card' | 'portfolio', slotIndex?: number) => {
        // 1. Inicia el estado de carga visualmente
        if (type === 'cover') setUploadingState(p => ({ ...p, cover: true }));
        else if (type === 'portfolio') setUploadingState(p => ({ ...p, portfolio: true }));
        else if (slotIndex !== undefined) setUploadingState(p => {
            const newCompCards = [...p.compCards]; newCompCards[slotIndex] = true;
            return { ...p, compCards: newCompCards };
        });

        try {
            // 2. Preparamos el FormData para enviarlo a nuestra API Route
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            if (slotIndex !== undefined) {
                formData.append('slotIndex', String(slotIndex));
            }
            
            // 3. Llamamos a nuestra propia API Route, que se encargará tanto de subir a R2 como de actualizar Supabase
            const res = await fetchSafe<{ success: boolean, path: string, signedUrl: string }>(`/api/models/${modelId}/storage`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok || !res.json?.success) {
              throw new Error(res.error || "La subida falló.");
            }
            
            toast.success('Imagen subida y guardada.');
            
            const { path: returnedPath, signedUrl } = res.json;

            // 4. Lógica de actualización de estado local con los datos de la respuesta
            if (type === 'cover') {
                if (signedUrl) setCoverUrl(signedUrl);
                if (returnedPath) setCoverPath(returnedPath);
            } else if (type === 'portfolio') {
                if (signedUrl) setPortfolioUrl(signedUrl);
                if (returnedPath) setPortfolioPath(returnedPath);
            } else if (type === 'comp-card' && slotIndex !== undefined) {
                if (signedUrl) setCompCardUrls(prev => {
                    const copy = [...prev]; copy[slotIndex] = signedUrl; return copy;
                });
                if (returnedPath) setCompCardPaths(prev => {
                    const copy = [...prev]; copy[slotIndex] = returnedPath; return copy;
                });
            }

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Ocurrió un error.';
            toast.error('Error al subir la imagen', { description: message });
        } finally {
             // 5. Detiene el estado de carga visual
             if (type === 'cover') setUploadingState(p => ({ ...p, cover: false }));
             else if (type === 'portfolio') setUploadingState(p => ({ ...p, portfolio: false }));
             else if (slotIndex !== undefined) setUploadingState(p => {
                 const newCompCards = [...p.compCards]; newCompCards[slotIndex] = false;
                 return { ...p, compCards: newCompCards };
             });
        }
    };

    const handleDelete = async (type: 'cover' | 'comp-card' | 'portfolio', slotIndex?: number) => {
        let filePathToDelete: string | null = null;

        if (type === 'cover') {
            filePathToDelete = coverPath;
        } else if (type === 'portfolio') {
            filePathToDelete = portfolioPath;
        } else if (slotIndex !== undefined && slotIndex >= 0 && slotIndex < 4) {
            filePathToDelete = compCardPaths[slotIndex];
        }

        if (!filePathToDelete) {
            toast.error('No se encontró la imagen para eliminar. Refresca la página.');
            return;
        }

        try {
            const res = await fetchSafe<{ success: boolean }>(`/api/models/${modelId}/storage`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath: filePathToDelete,
                    type: type,
                    slotIndex: slotIndex !== undefined ? String(slotIndex) : undefined
                }),
            });
            if (!res.ok) {
                console.error('Delete error:', res.error);
                toast.error(res.error || 'Respuesta no válida del servidor');
            } else {
                toast.success('Imagen eliminada.');
                if (type === 'cover') {
                    setCoverUrl(null); setCoverPath(null);
                } else if (type === 'portfolio') {
                    setPortfolioUrl(null); setPortfolioPath(null);
                } else if (type === 'comp-card' && slotIndex !== undefined) {
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
                                onFileSelect={(file) => handleUpload(file, 'cover')}
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
                                        onFileSelect={(file) => handleUpload(file, 'comp-card', index)}
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
                            onFileSelect={(file) => handleUpload(file, 'portfolio')}
                            onDelete={() => handleDelete('portfolio')}
                            label="Subir Imagen de Portafolio"
                            isUploading={uploadingState.portfolio}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
