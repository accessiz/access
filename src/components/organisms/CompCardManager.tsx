'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';

interface CompCardManagerProps {
  modelId: string;
}

// Tipo para la respuesta esperada de la API /api/models/[modelId]
type ApiImageData = {
    success: boolean;
    error?: string;
    coverUrl?: string | null;
    portfolioUrl?: string | null;
    compCardUrls?: (string | null)[];
    coverPath?: string | null;      // Ruta real para borrar
    portfolioPath?: string | null;  // Ruta real para borrar
    compCardPaths?: (string | null)[]; // Rutas reales para borrar (array de hasta 4)
};

// Componente reutilizable para cada slot de foto
const PhotoSlot = ({ className, imageUrl, onFileSelect, onDelete, label, isUploading }: {
    className?: string; imageUrl: string | null; onFileSelect: (file: File) => void;
    onDelete: () => void; label: string; isUploading: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
    // Limpiar el input para permitir subir el mismo archivo de nuevo si es necesario
    if (event.target) event.target.value = '';
  };

  return (
    <div className={cn("relative group bg-muted/50 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden transition-all", className)}>
      {/* Si hay imagen, mostrarla con opción de borrar al pasar el ratón */}
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
        // Si no hay imagen, mostrar botón de subida
        <div className="text-center p-4">
            <input type="file" ref={inputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/webp" className="hidden" />
            <Button variant="ghost" className="h-auto p-4 flex flex-col items-center justify-center" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                {isUploading
                    ? <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                    : <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                }
                <span className="text-xs font-normal text-muted-foreground">{isUploading ? 'Subiendo...' : label}</span>
            </Button>
        </div>
      )}
    </div>
  );
};


export function CompCardManager({ modelId }: CompCardManagerProps) {
    // Estados para las URLs (para mostrar las imágenes)
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [compCardUrls, setCompCardUrls] = useState<(string | null)[]>([null, null, null, null]);
    const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);

    // Estados para las rutas exactas de los archivos (para poder borrarlos)
    const [coverPath, setCoverPath] = useState<string | null>(null);
    const [compCardPaths, setCompCardPaths] = useState<(string | null)[]>([null, null, null, null]);
    const [portfolioPath, setPortfolioPath] = useState<string | null>(null);

    // Estado de carga inicial y de subida por slot
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingState, setUploadingState] = useState({ cover: false, compCards: [false, false, false, false], portfolio: false });

    // Función para cargar los datos de las imágenes desde la API
    const loadImages = async () => {
      if (!modelId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/models/${modelId}`);
        const data: ApiImageData = await response.json(); // Usar el tipo definido

        if (data.success) {
          // Guardar URLs para visualización
          setCoverUrl(data.coverUrl || null);
          setPortfolioUrl(data.portfolioUrl || null);
          // Asegurar que compCardUrls siempre tenga 4 elementos (rellenar con null)
          const fetchedCompUrls = data.compCardUrls || [];
          setCompCardUrls(Array(4).fill(null).map((_, i) => fetchedCompUrls[i] || null));

          // Guardar rutas exactas para borrado
          setCoverPath(data.coverPath || null);
          setPortfolioPath(data.portfolioPath || null);
          // Asegurar que compCardPaths siempre tenga 4 elementos
          const fetchedCompPaths = data.compCardPaths || [];
          setCompCardPaths(Array(4).fill(null).map((_, i) => fetchedCompPaths[i] || null));

        } else {
            throw new Error(data.error || 'No se pudieron interpretar los datos de las imágenes.');
        }
      } catch (error) {
        console.error("Error al cargar imágenes:", error);
        toast.error("No se pudieron cargar las imágenes del modelo.");
        // Resetear estados en caso de error
        setCoverUrl(null); setPortfolioUrl(null); setCompCardUrls([null, null, null, null]);
        setCoverPath(null); setPortfolioPath(null); setCompCardPaths([null, null, null, null]);
      } finally {
        setIsLoading(false);
      }
    };

    // Cargar imágenes al montar el componente o si cambia el modelId
    useEffect(() => {
        loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelId]);

    // Función para manejar la subida de un archivo
    const handleUpload = async (file: File, type: 'cover' | 'comp-card' | 'portfolio', slotIndex?: number) => {
        // Actualizar estado de subida
        if (type === 'cover') setUploadingState(p => ({ ...p, cover: true }));
        else if (type === 'portfolio') setUploadingState(p => ({ ...p, portfolio: true }));
        else if (slotIndex !== undefined) setUploadingState(p => {
            const newCompCards = [...p.compCards]; newCompCards[slotIndex] = true;
            return { ...p, compCards: newCompCards };
        });

        // Crear FormData para enviar el archivo
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (slotIndex !== undefined) formData.append('slotIndex', String(slotIndex));

        try {
            // Llamar a la API de subida
            const response = await fetch(`/api/models/${modelId}/storage`, { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Respuesta no válida del servidor');
            toast.success('Imagen subida correctamente.');
            await loadImages(); // Recargar datos después de subir exitosamente
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Ocurrió un error.';
            toast.error('Error al subir la imagen', { description: message });
        } finally {
            // Resetear estado de subida
             if (type === 'cover') setUploadingState(p => ({ ...p, cover: false }));
             else if (type === 'portfolio') setUploadingState(p => ({ ...p, portfolio: false }));
             else if (slotIndex !== undefined) setUploadingState(p => {
                 const newCompCards = [...p.compCards]; newCompCards[slotIndex] = false;
                 return { ...p, compCards: newCompCards };
             });
        }
    };

    // Función para manejar el borrado de una imagen
    const handleDelete = async (type: 'cover' | 'comp-card' | 'portfolio', slotIndex?: number) => {
        let filePathToDelete: string | null = null;

        // Determinar la ruta exacta del archivo a borrar usando los estados guardados
        if (type === 'cover') {
            filePathToDelete = coverPath;
        } else if (type === 'portfolio') {
            filePathToDelete = portfolioPath;
        } else if (slotIndex !== undefined && slotIndex >= 0 && slotIndex < 4) {
            filePathToDelete = compCardPaths[slotIndex];
        }

        // Si no tenemos la ruta, no podemos borrar
        if (!filePathToDelete) {
            toast.error('No se encontró la imagen para eliminar. Refresca la página.');
            return;
        }

        try {
            // Llamar a la API de borrado enviando la ruta exacta
                        const response = await fetch(`/api/models/${modelId}/storage`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    filePath: filePathToDelete,
                                    type: type,
                                    slotIndex: slotIndex !== undefined ? String(slotIndex) : undefined
                                }),
                        });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Respuesta no válida del servidor');
            toast.success('Imagen eliminada.');
            await loadImages(); // Recargar datos después de borrar exitosamente
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Ocurrió un error.';
            toast.error('Error al eliminar la imagen', { description: message });
        }
    };

    // Renderizado del componente
    return (
        <Card>
            <CardHeader>
                <CardTitle>Imágenes del Talento</CardTitle>
                <CardDescription>Sube y administra las imágenes de portada, portafolio y contraportada.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Mostrar esqueletos mientras carga */}
                {isLoading ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                         <div className="flex flex-col gap-2">
                             <div className="h-5 w-1/4 bg-muted rounded mb-2"></div> {/* Skeleton para label */}
                             <div className="aspect-[3/4] bg-muted rounded-lg"></div> {/* Skeleton para Portada */}
                         </div>
                         <div className="flex flex-col gap-2">
                            <div className="h-5 w-1/3 bg-muted rounded mb-2"></div> {/* Skeleton para label */}
                            <div className="grid grid-cols-2 gap-4">
                               {/* Skeletons para Contraportada */}
                               <div className="aspect-square bg-muted rounded-lg"></div>
                               <div className="aspect-square bg-muted rounded-lg"></div>
                               <div className="aspect-square bg-muted rounded-lg"></div>
                               <div className="aspect-square bg-muted rounded-lg"></div>
                            </div>
                         </div>
                         <div className="md:col-span-2 flex flex-col gap-2"> {/* Skeleton para Portafolio */}
                             <div className="h-5 w-2/5 bg-muted rounded mb-2"></div> {/* Skeleton para label */}
                             <div className="aspect-[11/8.5] max-h-64 bg-muted rounded-lg"></div>
                         </div>
                    </div>
                ) : (
                // Mostrar los slots de fotos una vez cargado
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Slot para Portada */}
                        <div>
                            <span className="text-sm font-medium text-muted-foreground mb-2 block">Portada (Slider)</span>
                            <PhotoSlot
                                className="aspect-[3/4]"
                                imageUrl={coverUrl}
                                onFileSelect={(file) => handleUpload(file, 'cover')}
                                onDelete={() => handleDelete('cover')}
                                label="Subir Portada"
                                isUploading={uploadingState.cover}
                            />
                        </div>
                        {/* Slots para Contraportada */}
                        <div>
                            <span className="text-sm font-medium text-muted-foreground mb-2 block">Contraportada (4 Fotos)</span>
                            <div className="grid grid-cols-2 gap-4">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <PhotoSlot
                                        key={index}
                                        className="aspect-square"
                                        imageUrl={compCardUrls[index]} // Usar el array de URLs correcto
                                        onFileSelect={(file) => handleUpload(file, 'comp-card', index)}
                                        onDelete={() => handleDelete('comp-card', index)}
                                        label={`Foto ${index + 1}`}
                                        isUploading={uploadingState.compCards[index]}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Slot para Portafolio */}
                     <div>
                        <span className="text-sm font-medium text-muted-foreground mb-2 block">Portafolio (Imagen Principal Horizontal)</span>
                        <PhotoSlot
                            className="aspect-[11/8.5] max-h-64" // Proporción común para portafolios
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