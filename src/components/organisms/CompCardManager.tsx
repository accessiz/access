
'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2, Loader2 } from 'lucide-react';
import { cn, mediaUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { uploadModelImage, deleteModelImage } from '@/lib/actions/storage';
import { ImageCropDialog } from './ImageCropDialog';
import { Model } from '@/lib/types';
import { CompCardPrintTemplate } from '@/app/dashboard/models/[id]/_components/CompCardPrintTemplate';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toJpeg, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { AlertCircle, ChevronDown, Download, ExternalLink, FileType, Layers } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator,
} from '@/components/ui/select';

interface CompCardManagerProps {
    model: Model;
    modelId: string;
    initialCoverUrl?: string | null;
    initialPortfolioUrl?: string | null;
    initialCompCardUrls?: (string | null)[];
    initialCoverPath?: string | null;
    initialPortfolioPath?: string | null;
    initialCompCardPaths?: (string | null)[];
    initialGalleryUrls?: (string | null)[];
    initialGalleryPaths?: (string | null)[];
}

// Interfaz para el estado del recorte
interface CropState {
    imageSrc: string | null;
    aspect: number;
    uploadType: 'cover' | 'comp-card' | 'portfolio' | 'gallery';
    slotIndex?: number;
}

// Interfaz para los items de carga de galería
interface GalleryUploadItem {
    id: string;
    file: File;
    progress: number; // 0-100
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
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
                    <img
                        src={imageUrl}
                        alt={label}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />
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
                        <span className="text-label font-normal text-muted-foreground">
                            {isUploading ? 'Subiendo...' : (isDragging ? 'Suelta la imagen aquí' : label)}
                        </span>
                    </Button>
                </div>
            )}
        </div>
    );
};


export function CompCardManager({
    model,
    modelId,
    initialCoverUrl = null,
    initialPortfolioUrl = null,
    initialCompCardUrls = [null, null, null, null],
    initialCoverPath = null,
    initialPortfolioPath = null,
    initialCompCardPaths = [null, null, null, null],
    initialGalleryUrls = [],
    initialGalleryPaths = [],
}: CompCardManagerProps) {
    const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl);
    const [compCardUrls, setCompCardUrls] = useState<(string | null)[]>(Array(4).fill(null).map((_, i) => initialCompCardUrls[i] || null));
    const [portfolioUrl, setPortfolioUrl] = useState<string | null>(initialPortfolioUrl);
    const [galleryUrls, setGalleryUrls] = useState<(string | null)[]>(initialGalleryUrls);

    const [coverPath, setCoverPath] = useState<string | null>(initialCoverPath);
    const [compCardPaths, setCompCardPaths] = useState<(string | null)[]>(Array(4).fill(null).map((_, i) => initialCompCardPaths[i] || null));
    const [portfolioPath, setPortfolioPath] = useState<string | null>(initialPortfolioPath);
    const [galleryPaths, setGalleryPaths] = useState<(string | null)[]>(initialGalleryPaths);

    // --- NUEVOS ESTADOS ---
    const [uploadingState, setUploadingState] = useState({ cover: false, compCards: [false, false, false, false], portfolio: false, gallery: false });
    const [cropState, setCropState] = useState<CropState | null>(null);

    // --- ESTADOS DE GALERÍA CON MULTI-UPLOAD ---
    const [galleryUploadQueue, setGalleryUploadQueue] = useState<GalleryUploadItem[]>([]);
    const [isDraggingGallery, setIsDraggingGallery] = useState(false);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // --- ESTADOS DE DESCARGA ---
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<'portada' | 'contraportada' | 'hoja_completa' | 'todos'>('hoja_completa');
    const [fileType, setFileType] = useState<'jpg' | 'png' | 'zip' | 'pdf'>('png');
    const printContainerId = 'compcard-print-container';

    // --- FUNCIÓN DE COMPRESIÓN EN EL CLIENTE ---
    const compressImage = async (file: File, maxWidth = 3000, maxHeight = 3000, quality = 0.85): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => {
                // Calcular nuevas dimensiones manteniendo aspect ratio
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                // Crear canvas y dibujar imagen redimensionada
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('No se pudo crear el contexto del canvas'));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a WebP blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('No se pudo comprimir la imagen'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
            img.src = URL.createObjectURL(file);
        });
    };

    // --- SUBIDA DIRECTA (para Portfolio y Gallery, sin recorte) ---
    const handleDirectUpload = async (file: File, uploadType: CropState['uploadType'], slotIndex?: number) => {
        const category = uploadType === 'comp-card' ? 'Contraportada' : (uploadType === 'cover' ? 'Portada' : (uploadType === 'gallery' ? 'PortfolioGallery' : 'Portfolio'));

        if (uploadType === 'cover') setUploadingState(p => ({ ...p, cover: true }));
        else if (uploadType === 'portfolio') setUploadingState(p => ({ ...p, portfolio: true }));
        else if (uploadType === 'gallery') setUploadingState(p => ({ ...p, gallery: true }));
        else if (slotIndex !== undefined) setUploadingState(p => {
            const newCompCards = [...p.compCards]; newCompCards[slotIndex] = true;
            return { ...p, compCards: newCompCards };
        });

        try {
            // Comprimir imagen en el cliente antes de subir
            const compressedFile = await compressImage(file);
            console.log(`[Portfolio] Imagen original: ${(file.size / 1024 / 1024).toFixed(2)}MB → Comprimida: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

            const formData = new FormData();
            formData.append('file', compressedFile);
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
                if (returnedPath) setCompCardPaths(prev => {
                    const copy = [...prev]; copy[slotIndex] = returnedPath; return copy;
                });
            } else if (category === 'PortfolioGallery') {
                if (publicUrl) setGalleryUrls(prev => [...prev, publicUrl]);
                if (returnedPath) setGalleryPaths(prev => [...prev, returnedPath]);
            }

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Ocurrió un error.';
            toast.error('Error al subir la imagen', { description: message });
        } finally {
            if (uploadType === 'cover') setUploadingState(p => ({ ...p, cover: false }));
            else if (uploadType === 'portfolio') setUploadingState(p => ({ ...p, portfolio: false }));
            else if (uploadType === 'gallery') setUploadingState(p => ({ ...p, gallery: false }));
            else if (slotIndex !== undefined) setUploadingState(p => {
                const newCompCards = [...p.compCards]; newCompCards[slotIndex] = false;
                return { ...p, compCards: newCompCards };
            });
        }
    };

    // Abre el diálogo de recorte cuando se selecciona un archivo (excepto Portfolio)
    const handleFileSelect = (file: File, uploadType: CropState['uploadType'], aspect: number, slotIndex?: number) => {
        // Portfolio y Gallery: subir directamente sin recorte
        if (uploadType === 'portfolio' || uploadType === 'gallery') {
            handleDirectUpload(file, uploadType, slotIndex);
            return;
        }

        // Cover y Contraportada: abrir diálogo de recorte
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

    // --- FUNCIÓN DE SUBIDA DESPUÉS DEL RECORTE ---
    // Se llama cuando el recorte se completa (Cover y Contraportada)
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

            // La URL ahora es única, no necesitamos el timestamp
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
            // Cierra el diálogo de recorte al finalizar
            handleCropDialogClose();
        }
    };

    const handleDelete = async (type: 'cover' | 'comp-card' | 'portfolio' | 'gallery', slotIndex?: number, path?: string) => {
        let filePathToDelete: string | null = null;
        const category = type === 'comp-card' ? 'Contraportada' : (type === 'cover' ? 'Portada' : (type === 'gallery' ? 'PortfolioGallery' : 'Portfolio'));

        if (category === 'Portada') {
            filePathToDelete = coverPath;
        } else if (category === 'Portfolio') {
            filePathToDelete = portfolioPath;
        } else if (slotIndex !== undefined && slotIndex >= 0 && slotIndex < 4) {
            filePathToDelete = compCardPaths[slotIndex];
        } else if (slotIndex !== undefined && slotIndex >= 0 && slotIndex < 4) {
            filePathToDelete = compCardPaths[slotIndex];
        } else if (category === 'PortfolioGallery' && path) {
            filePathToDelete = path;
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
                    setCompCardUrls(prev => { const copy = [...prev]; copy[slotIndex] = null; return copy; });
                    setCompCardPaths(prev => { const copy = [...prev]; copy[slotIndex] = null; return copy; });
                } else if (category === 'PortfolioGallery') {
                    setGalleryPaths(prev => prev.filter(p => p !== filePathToDelete));
                    // Nota: No podemos filtrar URLs fácilmente porque no tenemos el mapping 1:1 aquí sin más lógica,
                    // pero podemos asumir que si borramos el path, debemos refrescar o filtrar.
                    // Para simplificar, recargaremos la página o filtraremos si la URL coincide (si tuvieramos mapping).
                    // Como fallback, filtramos la URL si contiene el nombre del archivo borrado (parcialmente inseguro pero funciona visualmente).
                    // MEJOR: Pasar el índice del array de galería para borrar por índice localmente.
                    if (slotIndex !== undefined) {
                        setGalleryUrls(prev => prev.filter((_, i) => i !== slotIndex));
                        setGalleryPaths(prev => prev.filter((_, i) => i !== slotIndex));
                    }
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Ocurrió un error.';
            toast.error('Error al eliminar la imagen', { description: message });
        }
    };

    // --- MANEJADOR DE CARGA MÚLTIPLE PARA GALERÍA ---
    const handleGalleryMultiUpload = async (files: File[]) => {
        if (files.length === 0) return;

        // Filtrar solo imágenes válidas
        const validFiles = files.filter(file => file.type.startsWith('image/'));
        if (validFiles.length === 0) {
            toast.error('No se encontraron archivos de imagen válidos');
            return;
        }

        // Crear items de cola
        const queueItems: GalleryUploadItem[] = validFiles.map((file, index) => ({
            id: `${Date.now()}-${index}`,
            file,
            progress: 0,
            status: 'pending' as const,
        }));

        setGalleryUploadQueue(queueItems);

        // Procesar archivos uno por uno
        for (let i = 0; i < queueItems.length; i++) {
            const item = queueItems[i];

            // Marcar como subiendo
            setGalleryUploadQueue(prev =>
                prev.map(q => q.id === item.id ? { ...q, status: 'uploading', progress: 10 } : q)
            );

            try {
                // Comprimir imagen
                setGalleryUploadQueue(prev =>
                    prev.map(q => q.id === item.id ? { ...q, progress: 30 } : q)
                );
                const compressedFile = await compressImage(item.file);

                // Preparar FormData
                setGalleryUploadQueue(prev =>
                    prev.map(q => q.id === item.id ? { ...q, progress: 50 } : q)
                );
                const formData = new FormData();
                formData.append('file', compressedFile);
                formData.append('modelId', modelId);
                formData.append('category', 'PortfolioGallery');

                // Subir
                setGalleryUploadQueue(prev =>
                    prev.map(q => q.id === item.id ? { ...q, progress: 70 } : q)
                );
                const result = await uploadModelImage(formData);

                if (!result || !result.success) {
                    throw new Error(result.error || 'La subida falló.');
                }

                // Actualizar estado de galería
                const { path: returnedPath, publicUrl } = result;
                if (publicUrl) setGalleryUrls(prev => [...prev, publicUrl]);
                if (returnedPath) setGalleryPaths(prev => [...prev, returnedPath]);

                // Marcar como completado
                setGalleryUploadQueue(prev =>
                    prev.map(q => q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q)
                );

            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Error desconocido';
                setGalleryUploadQueue(prev =>
                    prev.map(q => q.id === item.id ? { ...q, status: 'error', error: message, progress: 0 } : q)
                );
            }
        }

        // Mostrar resultado
        const completed = queueItems.filter((_, i) => i < queueItems.length).length;
        toast.success(`${completed} imagen(es) subida(s) correctamente`);

        // Limpiar cola después de 2 segundos
        setTimeout(() => {
            setGalleryUploadQueue([]);
        }, 2000);
    };

    // Manejadores de drag and drop para galería
    const handleGalleryDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingGallery(true);
    };

    const handleGalleryDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingGallery(false);
    };

    const handleGalleryDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingGallery(false);

        const files = Array.from(e.dataTransfer.files);
        handleGalleryMultiUpload(files);
    };

    const handleGalleryFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        handleGalleryMultiUpload(files);
        if (e.target) e.target.value = '';
    };

    // --- LÓGICA DE DESCARGA ROBUSTA ---
    const handleDownload = async () => {
        setIsDownloading(true);
        // Sanitize filename more robustly
        let fileName = (model.alias || model.full_name || 'compcard')
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
            .replace(/[^a-zA-Z0-9]/g, '_') // Solo alfanuméricos y guiones
            .replace(/_+/g, '_') // Consolidar guiones múltiples
            .replace(/^_|_$/g, '') // Quitar guiones al inicio/fin
            .toLowerCase();

        // Fallback si el nombre quedó vacío después de sanitización
        if (!fileName || fileName.length === 0) {
            fileName = 'compcard';
        }

        const wrapper = document.getElementById('compcard-wrapper');
        let originalWrapperStyle: Record<string, string> | null = null;

        try {
            // Definir qué elementos capturar según el formato elegido
            const targets: { id: string; suffix: string; label: string }[] = [];

            if (downloadFormat === 'todos') {
                targets.push(
                    { id: `${printContainerId}-front`, suffix: 'portada', label: 'Portada' },
                    { id: `${printContainerId}-back`, suffix: 'contraportada', label: 'Contraportada' },
                    { id: printContainerId, suffix: 'hoja_completa', label: 'Hoja Completa' }
                );
            } else {
                const targetId = downloadFormat === 'portada'
                    ? `${printContainerId}-front`
                    : (downloadFormat === 'contraportada' ? `${printContainerId}-back` : printContainerId);
                targets.push({ id: targetId, suffix: downloadFormat, label: downloadFormat });
            }

            // Validar existencia de elementos
            for (const t of targets) {
                const el = document.getElementById(t.id);
                if (!el) throw new Error(`Elementos necesarios no encontrados (${t.label}). Refresca la página.`);
            }

            // 1. Preparar el wrapper (OFFSCREEN)
            if (wrapper) {
                originalWrapperStyle = {
                    position: wrapper.style.position,
                    left: wrapper.style.left,
                    top: wrapper.style.top,
                    width: wrapper.style.width,
                    height: wrapper.style.height,
                    overflow: wrapper.style.overflow,
                    opacity: wrapper.style.opacity,
                    zIndex: wrapper.style.zIndex,
                };

                wrapper.style.position = 'fixed';
                wrapper.style.left = '-10000px';
                wrapper.style.top = '0';
                wrapper.style.width = '3300px';
                wrapper.style.height = '2550px';
                wrapper.style.overflow = 'visible';
                wrapper.style.opacity = '1';
                wrapper.style.zIndex = '-9999';
            }

            // 2. Dar tiempo al navegador (Reflow)
            await new Promise(resolve => setTimeout(resolve, 100));

            // 3. Esperar carga de imágenes
            // Escaneamos TODOS los elementos involucrados
            const allImages: HTMLImageElement[] = [];
            targets.forEach(t => {
                const el = document.getElementById(t.id);
                if (el) allImages.push(...Array.from(el.getElementsByTagName('img')));
            });

            console.log(`[Download] Validando ${allImages.length} imágenes...`);

            await Promise.all(allImages.map(img => {
                if (img.complete && img.naturalHeight > 0) return Promise.resolve();
                if (!img.src) return Promise.resolve();

                return new Promise((resolve) => {
                    const finish = () => resolve(true);

                    if (img.complete && img.naturalHeight > 0) { finish(); return; }

                    const onLoad = () => { cleanup(); finish(); };
                    const onError = () => {
                        console.warn('Imagen falló al cargar:', img.src);
                        cleanup(); finish();
                    };
                    const cleanup = () => {
                        img.removeEventListener('load', onLoad);
                        img.removeEventListener('error', onError);
                    };

                    img.addEventListener('load', onLoad);
                    img.addEventListener('error', onError);

                    setTimeout(() => {
                        console.warn('Timeout imagen:', img.src);
                        cleanup();
                        finish();
                    }, 5000);
                });
            }));

            // 4. Delay de estabilización final
            await new Promise(resolve => setTimeout(resolve, 800));

            const captureOptions = {
                quality: 0.95,
                pixelRatio: 2,
                cacheBust: true,
                // FIX Firefox: skipFonts evita error "font is undefined"
                skipFonts: true,
                // Fix para Firefox: evita error "can't access property 'trim', e is undefined"
                // causado por estilos computados que devuelven undefined en Firefox
                filter: (node: HTMLElement | Node): boolean => {
                    // Excluir elementos que no son relevantes para la captura
                    if (node instanceof HTMLElement) {
                        // Excluir inputs y scripts que pueden causar problemas
                        const tagName = node.tagName?.toLowerCase();
                        if (tagName === 'script' || tagName === 'noscript') {
                            return false;
                        }
                    }
                    return true;
                },
                // SkipAutoScale mejora compatibilidad cross-browser
                skipAutoScale: true,
            };

            console.log('[CompCard Download] Opciones de captura:', JSON.stringify({
                quality: captureOptions.quality,
                pixelRatio: captureOptions.pixelRatio,
                skipFonts: captureOptions.skipFonts,
                skipAutoScale: captureOptions.skipAutoScale,
                downloadFormat,
                fileType,
                targetsCount: targets.length
            }));

            const validateDataUrl = (data: string, type: 'png' | 'jpeg') => {
                const header = type === 'png' ? 'data:image/png' : 'data:image/jpeg';
                return data && data.startsWith(header) && data.length > 1000;
            };

            // 5. Generar contenido y Descargar
            if (fileType === 'zip') {
                if (downloadFormat !== 'todos') {
                    throw new Error('La descarga ZIP solo está disponible para "Todos los formatos".');
                }

                const zip = new JSZip();

                for (const t of targets) {
                    const el = document.getElementById(t.id);
                    if (!el) continue;

                    // Siempre capturamos como JPEG para el ZIP para ahorrar espacio, o según preferencia.
                    // Usualmente comp cards son JPEGs.
                    const data = await toJpeg(el, captureOptions);
                    if (validateDataUrl(data, 'jpeg')) {
                        zip.file(`${fileName}_${t.suffix}.jpg`, data.split(',')[1], { base64: true });
                    }
                }

                const content = await zip.generateAsync({
                    type: 'blob',
                    mimeType: 'application/zip'
                });
                const url = URL.createObjectURL(content);

                const link = document.createElement('a');
                link.download = `${fileName}_completo.zip`; // Set download BEFORE href
                link.href = url;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 100);

            } else {
                // Caso individual (JPG, PNG, PDF)
                // Si el usuario seleccionó "Todos" pero un formato NO ZIP, 
                // descargamos solo la hoja completa o generamos error?
                // Comportamiento lógico: Si es "Todos" y no es ZIP, generamos hoja completa PDF multipágina o iteramos.
                // Para simplificar y evitar descargas múltiples bloqueadas, si es "Todos" y NO ZIP, forzamos ZIP o descargamos hoja completa combinada.
                // Pero según UI constraints, ZIP solo se habilita con "Todos".
                // Asumiremos que si llega aquí con "Todos" y no ZIP, es un caso borde, fallback a Hoja Completa.

                const targetId = downloadFormat === 'todos' ? printContainerId : targets[0].id;
                const finalSuffix = downloadFormat === 'todos' ? 'hoja_completa' : downloadFormat;

                // Si el usuario elige "Todos" y "PDF", podríamos hacer un PDF de 3 páginas.
                // IMPLEMENTACIÓN MEJORADA: PDF Multipágina para "Todos"
                if (downloadFormat === 'todos' && fileType === 'pdf') {
                    console.log('[Download] Generando PDF multipágina...');
                    const pdf = new jsPDF({
                        orientation: 'landscape',
                        unit: 'in',
                        format: [11, 8.5] // Hoja completa landscape por defecto
                    });

                    // Página 1: Hoja Completa
                    const elFull = document.getElementById(printContainerId);
                    if (elFull) {
                        const dFull = await toJpeg(elFull, captureOptions);
                        pdf.addImage(dFull, 'JPEG', 0, 0, 11, 8.5);
                    }

                    // Página 2: Portada (Portrait)
                    const elFront = document.getElementById(`${printContainerId}-front`);
                    if (elFront) {
                        pdf.addPage([5.5, 8.5], 'p');
                        const dFront = await toJpeg(elFront, captureOptions);
                        pdf.addImage(dFront, 'JPEG', 0, 0, 5.5, 8.5);
                    }

                    // Página 3: Contraportada (Portrait)
                    const elBack = document.getElementById(`${printContainerId}-back`);
                    if (elBack) {
                        pdf.addPage([5.5, 8.5], 'p');
                        const dBack = await toJpeg(elBack, captureOptions);
                        pdf.addImage(dBack, 'JPEG', 0, 0, 5.5, 8.5);
                    }

                    pdf.save(`${fileName}_book.pdf`);

                } else {
                    // Descarga simple (JPG, PNG, PDF simple)
                    const el = document.getElementById(targetId);
                    if (!el) throw new Error('Elemento no encontrado');

                    let dataUrl = '';
                    if (fileType === 'png') dataUrl = await toPng(el, captureOptions);
                    else dataUrl = await toJpeg(el, captureOptions); // PDF usa JPEG intermedio

                    if (!validateDataUrl(dataUrl, fileType === 'png' ? 'png' : 'jpeg')) {
                        throw new Error('Imagen generada inválida');
                    }

                    if (fileType === 'pdf') {
                        const isLandscape = finalSuffix === 'hoja_completa';
                        const pdf = new jsPDF({
                            orientation: isLandscape ? 'l' : 'p',
                            unit: 'in',
                            format: [isLandscape ? 11 : 5.5, 8.5]
                        });
                        const w = isLandscape ? 11 : 5.5;
                        const h = 8.5;
                        pdf.addImage(dataUrl, 'JPEG', 0, 0, w, h);
                        pdf.save(`${fileName}_${finalSuffix}.pdf`);
                    } else {
                        // Descarga de imagen convirtiendo dataUrl a Blob para asegurar MIME type
                        const response = await fetch(dataUrl);
                        const blob = await response.blob();
                        const blobWithMime = new Blob([blob], { type: fileType === 'png' ? 'image/png' : 'image/jpeg' });
                        const url = URL.createObjectURL(blobWithMime);

                        const link = document.createElement('a');
                        link.download = `${fileName}_${finalSuffix}.${fileType}`; // Set download BEFORE href
                        link.href = url;
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        // Clean up immediately after click
                        setTimeout(() => {
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        }, 100);
                    }
                }
            }

            toast.success('Descarga completada con éxito.');

        } catch (error: unknown) {
            console.error('Error en descarga:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            if (errorMessage?.includes('tainted') || errorMessage?.includes('CORS')) {
                toast.error('Error de CORS', { description: 'Recarga la página e intenta de nuevo.' });
            } else {
                toast.error('Error al generar', { description: errorMessage });
            }
        } finally {
            if (wrapper && originalWrapperStyle) {
                // Restore wrapper
                Object.assign(wrapper.style, originalWrapperStyle);
            }
            setIsDownloading(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col items-start justify-between gap-4 pb-7 sm:flex-row sm:items-center sm:gap-0">
                    <div className="space-y-1.5">
                        <CardTitle>Imágenes del Talento</CardTitle>
                    </div>

                    {/* BOTÓN DE DESCARGA DROPDOWN */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2">
                                <Download className="h-4 w-4" />
                                Descargar CompCard
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72 p-3 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-label font-semibold text-muted-foreground uppercase flex items-center gap-1.5 ml-1">
                                    <Layers className="h-3 w-3" />
                                    Qué descargar
                                </Label>
                                <Select
                                    value={downloadFormat}
                                    onValueChange={(v) => {
                                        const val = v as typeof downloadFormat;
                                        setDownloadFormat(val);
                                        // Si selecciona "todos", forzamos a "zip"
                                        if (val === 'todos') {
                                            setFileType('zip');
                                        } else if (fileType === 'zip') {
                                            // Si vuelve de "todos" a otro formato y estaba en "zip", volvemos a "png"
                                            setFileType('png');
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full bg-muted/50 border-none h-10">
                                        <SelectValue placeholder="Selecciona formato" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hoja_completa">Hoja completa</SelectItem>
                                        <SelectItem value="portada">Solo Portada</SelectItem>
                                        <SelectItem value="contraportada">Solo Contraportada</SelectItem>
                                        <SelectSeparator />
                                        <SelectItem value="todos" className="font-semibold text-primary">Todos los formatos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-label font-semibold text-muted-foreground uppercase flex items-center gap-1.5 ml-1">
                                    <FileType className="h-3 w-3" />
                                    Formato de archivo
                                </Label>
                                <Select value={fileType} onValueChange={(v) => setFileType(v as typeof fileType)}>
                                    <SelectTrigger className="w-full bg-muted/50 border-none h-10">
                                        <SelectValue placeholder="Selecciona tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {downloadFormat === 'todos' ? (
                                            <SelectItem value="zip">ZIP (Pack Completo)</SelectItem>
                                        ) : (
                                            <>
                                                <SelectItem value="pdf">PDF</SelectItem>
                                                <SelectItem value="jpg">JPG</SelectItem>
                                                <SelectItem value="png">PNG</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <DropdownMenuSeparator className="-mx-3" />

                            <div className="pt-1">
                                <Button
                                    className="w-full h-10 font-bold"
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        'Descargar'
                                    )}
                                </Button>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div>
                                <span className="text-body text-muted-foreground mb-2 block">Portada (Slider)</span>
                                <PhotoSlot
                                    className="aspect-3/4"
                                    imageUrl={coverUrl}
                                    onFileSelect={(file) => handleFileSelect(file, 'cover', 3 / 4)}
                                    onDelete={() => handleDelete('cover')}
                                    label="Subir Portada"
                                    isUploading={uploadingState.cover}
                                />
                            </div>
                            <div>
                                <span className="text-body text-muted-foreground mb-2 block">Contraportada (4 Fotos)</span>
                                <div className="grid grid-cols-2 gap-4">
                                    {Array.from({ length: 4 }).map((_, index) => {
                                        // Ratio calculado de CompCardPrintTemplate (735px / 1031px)
                                        const aspectRatioClass = "aspect-[735/1031]";

                                        if (index === 1) {
                                            return (
                                                <div
                                                    key={index}
                                                    className={`${aspectRatioClass} bg-muted/30 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center p-4 text-center`}
                                                >
                                                    <span className="text-muted-foreground/50 text-body">
                                                        Reservado para Información
                                                    </span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <PhotoSlot
                                                key={index}
                                                className={aspectRatioClass}
                                                imageUrl={compCardUrls[index]}
                                                onFileSelect={(file) => handleFileSelect(file, 'comp-card', 735 / 1031, index)}
                                                onDelete={() => handleDelete('comp-card', index)}
                                                label={`Foto ${index + 1}`}
                                                isUploading={uploadingState.compCards[index]}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div>
                            <span className="text-body text-muted-foreground mb-2 block">Portafolio (Imagen Principal Horizontal)</span>
                            <PhotoSlot
                                className="aspect-[11/8.5] max-h-64"
                                imageUrl={portfolioUrl}
                                onFileSelect={(file) => handleFileSelect(file, 'portfolio', 11 / 8.5)}
                                onDelete={() => handleDelete('portfolio')}
                                label="Subir Imagen de Portafolio"
                                isUploading={uploadingState.portfolio}
                            />
                        </div>

                    </div>
                </CardContent>
            </Card>

            {/* Tarjeta de Galería de Portafolio - Separada */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Galería de Portafolio</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* 1. ZONA DE DRAG & DROP SUPERIOR (Full Width) */}
                        <div
                            className={cn(
                                "relative border-2 border-dashed rounded-xl p-10 transition-all text-center cursor-pointer group",
                                isDraggingGallery
                                    ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                                    : "border-border hover:border-primary/50 hover:bg-muted/30",
                                (galleryUrls.length === 0 && galleryUploadQueue.length === 0) ? "py-20" : "py-8"
                            )}
                            onDragOver={handleGalleryDragOver}
                            onDragLeave={handleGalleryDragLeave}
                            onDrop={handleGalleryDrop}
                            onClick={() => galleryInputRef.current?.click()}
                        >
                            <input
                                ref={galleryInputRef}
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleGalleryFileInputChange}
                                className="hidden"
                            />

                            <div className="flex flex-col items-center justify-center pointer-events-none">
                                <div className={cn(
                                    "p-4 rounded-full bg-muted transition-transform duration-300 group-hover:scale-110 mb-4",
                                    isDraggingGallery && "bg-primary/10"
                                )}>
                                    <UploadCloud className={cn(
                                        "h-8 w-8 text-muted-foreground transition-colors",
                                        isDraggingGallery && "text-primary"
                                    )} />
                                </div>
                                <h3 className="text-body font-medium text-foreground">
                                    {isDraggingGallery ? 'Suelta las imágenes aquí' : 'Sube fotos a la galería'}
                                </h3>
                                <p className="text-label text-muted-foreground mt-1 max-w-xs mx-auto">
                                    Arrastra y suelta múltiples archivos o haz clic para explorar.
                                    Soporta JPG, PNG, WEBP.
                                </p>
                            </div>
                        </div>

                        {/* 2. MASONRY GRID (Pinterest Style) - Vertical Columns */}
                        {(galleryUrls.length > 0 || galleryUploadQueue.length > 0) && (
                            <div className="columns-2 md:columns-3 lg:columns-4 gap-1">
                                {/* Items de la cola de subida (aparecen primero visualmente si queremos, o mezclados) */}
                                {galleryUploadQueue.map((item) => (
                                    <div
                                        key={item.id}
                                        className="break-inside-avoid mb-1 relative overflow-hidden bg-muted/30 border border-border group"
                                    >
                                        <div className="aspect-3/4 w-full flex flex-col items-center justify-center p-4">
                                            {item.status === 'uploading' ? (
                                                <>
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                                                    <div className="w-full max-w-[80%] h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-300"
                                                            style={{ width: `${item.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-label text-muted-foreground mt-2">{item.progress}%</span>
                                                </>
                                            ) : item.status === 'error' ? (
                                                <div className="text-destructive flex flex-col items-center">
                                                    <AlertCircle className="h-8 w-8 mb-2" />
                                                    <span className="text-label text-center px-2">Error al subir</span>
                                                </div>
                                            ) : (
                                                <Loader2 className="h-6 w-6 text-muted-foreground/30 animate-pulse" />
                                            )}
                                        </div>

                                        {/* Preview si está disponible (podríamos leerlo del file si quisiéramos ser más fancy, pero por ahora mostramos placeholder) */}
                                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
                                    </div>
                                ))}

                                {/* Imágenes Existentes */}
                                {galleryUrls.map((url, i) => {
                                    if (!url) return null;
                                    return (
                                        <div
                                            key={`gallery-img-${i}`}
                                            className="break-inside-avoid mb-1 relative group overflow-hidden bg-muted"
                                        >
                                            <img
                                                src={url}
                                                alt={`Galería ${i + 1}`}
                                                className="w-full h-auto block transform transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />

                                            {/* Overlay con acciones */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-9 w-9 bg-background/90 hover:bg-background text-destructive shadow-sm backdrop-blur-sm"
                                                    onClick={() => handleDelete('gallery', i, galleryPaths[i] || undefined)}
                                                    title="Eliminar foto"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-background/90 hover:bg-background text-foreground shadow-sm backdrop-blur-sm transition-colors"
                                                    title="Ver original"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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

            {/* Template oculto para impresión/descarga */}
            {/* Usamos opacity: 0.01 y un contenedor rígidamente dimensionado */}
            <div
                id="compcard-wrapper"
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    opacity: 0.01,
                    zIndex: -9999
                }}
            >
                <div style={{ width: '3300px', height: '2550px', backgroundColor: 'rgb(var(--background) / 1)' }}>
                    <CompCardPrintTemplate
                        model={{
                            ...model,
                            coverUrl: mediaUrl(coverUrl) ?? null,
                            compCardUrls: compCardUrls.map(url => mediaUrl(url) ?? null)
                        }}
                        containerId={printContainerId}
                    />
                </div>
            </div>
        </>
    );
}
