
'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2, Loader2 } from 'lucide-react';
import { cn, mediaUrl } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';
import { uploadModelImage, deleteModelImage } from '@/lib/actions/storage';
import { ImageCropDialog } from './ImageCropDialog';
import { Model } from '@/lib/types';
import { CompCardPrintTemplate } from '@/app/dashboard/models/[id]/_components/CompCardPrintTemplate';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { toJpeg, toPng, toBlob } from 'html-to-image';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { ChevronDown, Download } from 'lucide-react';

interface CompCardManagerProps {
    model: Model;
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
    model,
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

    // --- ESTADOS DE DESCARGA ---
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<'portada' | 'contraportada' | 'hoja_completa' | 'todos'>('hoja_completa');
    const [fileType, setFileType] = useState<'jpg' | 'png' | 'zip' | 'pdf'>('pdf');
    const printContainerId = 'compcard-print-container';

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

    // --- LÓGICA DE DESCARGA ROBUSTA ---
    const handleDownload = async () => {
        setIsDownloading(true);
        const fileName = `${model.alias || model.full_name || 'compcard'}`.replace(/\s+/g, '_');

        const wrapper = document.getElementById('compcard-wrapper');
        let originalWrapperStyle: any = null;

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
                skipFonts: false,
            };

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

                const content = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(content);

                const link = document.createElement('a');
                link.href = url;
                link.download = `${fileName}_completo.zip`;
                document.body.appendChild(link); // Importante: agregar al DOM
                link.click();
                document.body.removeChild(link); // Limpiar
                setTimeout(() => URL.revokeObjectURL(url), 1000); // Revocar tras uso

            } else {
                // Caso individual (JPG, PNG, PDF)
                // Si el usuario seleccionó "Todos" pero un formato NO ZIP, 
                // descargamos solo la hoja completa o generamos error?
                // Comportamiento lógico: Si es "Todos" y no es ZIP, generamos hoja completa PDF multipágina o iteramos.
                // Para simplificar y evitar descargas múltiples bloqueadas, si es "Todos" y NO ZIP, forzamos ZIP o descargamos hoja completa combinada.
                // Pero según UI constraints, ZIP solo se habilita con "Todos".
                // Asumiremos que si llega aquí con "Todos" y no ZIP, es un caso borde, fallback a Hoja Completa.

                let targetId = downloadFormat === 'todos' ? printContainerId : targets[0].id;
                let finalSuffix = downloadFormat === 'todos' ? 'hoja_completa' : downloadFormat;

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
                        pdf.save(`${fileName}.pdf`);
                    } else {
                        // Descarga directa de imagen
                        const link = document.createElement('a');
                        link.download = `${fileName}_${finalSuffix}.${fileType}`;
                        link.href = dataUrl;
                        document.body.appendChild(link); // Agregar al DOM
                        link.click();
                        document.body.removeChild(link); // Remover
                    }
                }
            }

            toast.success('Descarga completada con éxito.');

        } catch (error: any) {
            console.error('Error en descarga:', error);
            if (error?.message?.includes('tainted') || error?.message?.includes('CORS')) {
                toast.error('Error de CORS', { description: 'Recarga la página e intenta de nuevo.' });
            } else {
                toast.error('Error al generar', { description: error.message });
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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                    <div className="space-y-1.5">
                        <CardTitle>Imágenes del Talento</CardTitle>
                        <CardDescription>Sube y administra las imágenes de portada, portafolio y contraportada.</CardDescription>
                    </div>

                    {/* BOTÓN DE DESCARGA DROPDOWN */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Descargar CompCard
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Qué descargar</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={downloadFormat} onValueChange={(v) => setDownloadFormat(v as any)}>
                                <DropdownMenuRadioItem value="hoja_completa">Hoja completa</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="portada">Solo Portada</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="contraportada">Solo Contraportada</DropdownMenuRadioItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioItem value="todos" className="font-semibold text-primary">Todos los formatos</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuLabel>Formato de archivo</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={fileType} onValueChange={(v) => setFileType(v as any)}>
                                <DropdownMenuRadioItem value="pdf">PDF</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="jpg">JPG</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="png">PNG</DropdownMenuRadioItem>
                                {downloadFormat === 'todos' && (
                                    <DropdownMenuRadioItem value="zip">ZIP (Pack Completo)</DropdownMenuRadioItem>
                                )}
                            </DropdownMenuRadioGroup>

                            <DropdownMenuSeparator />

                            <div className="p-2">
                                <Button
                                    className="w-full"
                                    size="sm"
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
                                <span className="text-label-14 text-muted-foreground mb-2 block">Portada (Slider)</span>
                                <PhotoSlot
                                    className="aspect-[3/4]"
                                    imageUrl={coverUrl}
                                    onFileSelect={(file) => handleFileSelect(file, 'cover', 3 / 4)}
                                    onDelete={() => handleDelete('cover')}
                                    label="Subir Portada"
                                    isUploading={uploadingState.cover}
                                />
                            </div>
                            <div>
                                <span className="text-label-14 text-muted-foreground mb-2 block">Contraportada (4 Fotos)</span>
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
                                                    <span className="text-muted-foreground/50 text-sm">
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
                            <span className="text-label-14 text-muted-foreground mb-2 block">Portafolio (Imagen Principal Horizontal)</span>
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
                <div style={{ width: '3300px', height: '2550px', backgroundColor: '#ffffff' }}>
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
