'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CompCardManagerProps {
  modelId: string;
}

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
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button variant="destructive" size="icon" onClick={onDelete} disabled={isUploading}><Trash2 /></Button>
          </div>
        </>
      ) : (
        <div className="text-center p-4">
            <input type="file" ref={inputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/webp" className="hidden" />
            <Button variant="ghost" className="h-auto p-4 flex flex-col items-center justify-center" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" /> : <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />}
                <span className="text-xs font-normal text-muted-foreground">{isUploading ? 'Subiendo...' : label}</span>
            </Button>
        </div>
      )}
    </div>
  );
};


export function CompCardManager({ modelId }: CompCardManagerProps) {
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [compCardUrls, setCompCardUrls] = useState<(string | null)[]>([null, null, null, null]);
    const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingState, setUploadingState] = useState({ cover: false, compCards: [false, false, false, false], portfolio: false });

    // Función para recargar las imágenes desde la API GET
    const loadImages = async () => {
      if (!modelId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/models/${modelId}`); // Llama a la API de GET
        const data = await response.json();
        if (data.success) {
          setCoverUrl(data.coverUrl || null);
          setPortfolioUrl(data.portfolioUrl || null);
          const contraportadas = data.compCardUrls || [];
          const filledUrls = Array(4).fill(null).map((_, i) => contraportadas[i] || null);
          setCompCardUrls(filledUrls);
        } else {
            throw new Error(data.error || 'Failed to parse image data.');
        }
      } catch (error) {
        console.error("Error al cargar imágenes:", error);
        toast.error("No se pudieron cargar las imágenes del modelo.");
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
        loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelId]);

    const handleUpload = async (file: File, type: 'cover' | 'comp-card' | 'portfolio', slotIndex?: number) => {
        if (type === 'cover') setUploadingState(p => ({ ...p, cover: true }));
        else if (type === 'portfolio') setUploadingState(p => ({ ...p, portfolio: true }));
        else if (slotIndex !== undefined) setUploadingState(p => {
            const newCompCards = [...p.compCards]; newCompCards[slotIndex] = true;
            return { ...p, compCards: newCompCards };
        });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (slotIndex !== undefined) formData.append('slotIndex', String(slotIndex));

        try {
            // *** CAMBIO CLAVE: Llama a la nueva API de STORAGE ***
            const response = await fetch(`/api/models/${modelId}/storage`, { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Respuesta no válida del servidor');
            toast.success('Imagen subida correctamente.');
            await loadImages(); // Recarga las imágenes para ver el cambio
        } catch (error: any) {
            toast.error('Error al subir la imagen', { description: error.message });
        } finally {
            if (type === 'cover') setUploadingState(p => ({ ...p, cover: false }));
            else if (type === 'portfolio') setUploadingState(p => ({ ...p, portfolio: false }));
            else if (slotIndex !== undefined) setUploadingState(p => {
                const newCompCards = [...p.compCards]; newCompCards[slotIndex] = false;
                return { ...p, compCards: newCompCards };
            });
        }
    };

    const handleDelete = async (type: 'cover' | 'comp-card' | 'portfolio', slotIndex?: number) => {
        const filePath = type === 'cover' 
            ? `${modelId}/Portada/cover.jpg` 
            : type === 'portfolio'
            ? `${modelId}/Portfolio/portfolio.jpg`
            : `${modelId}/Contraportada/comp_${slotIndex}.jpg`;

        try {
            // *** CAMBIO CLAVE: Llama a la nueva API de STORAGE ***
            const response = await fetch(`/api/models/${modelId}/storage`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Respuesta no válida del servidor');
            toast.success('Imagen eliminada.');
            await loadImages(); // Recarga las imágenes para ver el cambio
        } catch (error: any) {
            toast.error('Error al eliminar la imagen', { description: error.message });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Imágenes del Talento</CardTitle>
                <CardDescription>Sube y administra las imágenes de portada, portafolio y contraportada.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="flex flex-col gap-2">
                             <span className="text-sm font-medium text-muted-foreground mb-2 block h-5 w-1/4 bg-muted animate-pulse rounded"></span>
                             <div className="aspect-[3/4] bg-muted animate-pulse rounded-lg"></div>
                         </div>
                         <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-muted-foreground mb-2 block h-5 w-1/3 bg-muted animate-pulse rounded"></span>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="aspect-square bg-muted animate-pulse rounded-lg"></div>
                               <div className="aspect-square bg-muted animate-pulse rounded-lg"></div>
                               <div className="aspect-square bg-muted animate-pulse rounded-lg"></div>
                               <div className="aspect-square bg-muted animate-pulse rounded-lg"></div>
                            </div>
                         </div>
                    </div>
                ) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <span className="text-sm font-medium text-muted-foreground mb-2 block">Portada (Slider)</span>
                            <PhotoSlot className="aspect-[3/4]" imageUrl={coverUrl} onFileSelect={(file) => handleUpload(file, 'cover')} onDelete={() => handleDelete('cover')} label="Subir Portada" isUploading={uploadingState.cover}/>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-muted-foreground mb-2 block">Contraportada (4 Fotos)</span>
                            <div className="grid grid-cols-2 gap-4">
                                {compCardUrls.map((url, index) => (
                                    <PhotoSlot key={index} className="aspect-square" imageUrl={url} onFileSelect={(file) => handleUpload(file, 'comp-card', index)} onDelete={() => handleDelete('comp-card', index)} label={`Foto ${index + 1}`} isUploading={uploadingState.compCards[index]}/>
                                ))}
                            </div>
                        </div>
                    </div>
                     <div>
                        <span className="text-sm font-medium text-muted-foreground mb-2 block">Portafolio (Imagen Principal Horizontal)</span>
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
                )}
            </CardContent>
        </Card>
    );
}