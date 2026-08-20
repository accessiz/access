'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UploadCloud,
  Trash2,
  Loader2,
  Download,
  Layers,
  FileType,
  ChevronDown,
  Info,
  User,
  ImageIcon,
} from 'lucide-react';
import { cn, toCorsUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { ImageCropDialog } from '@/components/organisms/ImageCropDialog';
import { CompCardPrintTemplate } from '@/app/(dashboard)/dashboard/models/[id]/_components/CompCardPrintTemplate';
import { countries } from '@/lib/countries';
import { genderOptions, topSizeOptions, malePantsSizeOptions, femalePantsSizeOptions } from '@/lib/options';
import type { Model } from '@/lib/types';

interface CropState {
  imageSrc: string;
  aspect: number;
  slot: 'cover' | 0 | 2 | 3;
}

interface PhotoSlotProps {
  className?: string;
  imageUrl: string | null;
  onFileSelect: (file: File) => void;
  onDelete: () => void;
  label: string;
}

const PhotoSlot = ({ className, imageUrl, onFileSelect, onDelete, label }: PhotoSlotProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
    if (event.target) event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      } else {
        toast.error('Archivo no válido', { description: 'Por favor, arrastra un archivo de imagen.' });
      }
    }
  };

  return (
    <div
      className={cn(
        "relative group bg-quaternary border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center overflow-hidden transition-all",
        isDragging && "border-primary ring-2 ring-primary ring-offset-2",
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
          <div className="absolute inset-0 bg-black/20 md:bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={onDelete}
              className="overlay-action-btn delete"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Borrar {label}</span>
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center p-4">
          <input
            type="file"
            ref={inputRef}
            onChange={handleFileChange}
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
          />
          <Button
            variant="ghost"
            className="h-auto p-4 flex flex-col items-center justify-center w-full"
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-label font-normal text-muted-foreground text-center">
              {isDragging ? 'Suelta aquí' : label}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};

const PreviewScaleWrapper = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      setScale(width / 3300);
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full relative overflow-hidden" style={{ height: `${2550 * scale}px` }}>
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: '3300px',
          height: '2550px',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default function CompCardGeneratorPage() {
  // Form states
  const [alias, setAlias] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [height, setHeight] = useState('');
  const [shoulders, setShoulders] = useState('');
  const [bustChest, setBustChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [topSize, setTopSize] = useState('');
  const [pantsSize, setPantsSize] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [country, setCountry] = useState('GUATEMALA');

  // Image states
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [compCardUrls, setCompCardUrls] = useState<(string | null)[]>(Array(4).fill(null));

  // Crop dialog states
  const [cropState, setCropState] = useState<CropState | null>(null);

  // Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'portada' | 'contraportada' | 'hoja_completa' | 'todos'>('hoja_completa');
  const [fileType, setFileType] = useState<'jpg' | 'png' | 'zip' | 'pdf'>('png');

  const printContainerId = 'compcard-print-container';

  const handleFileSelect = (file: File, aspect: number, slot: CropState['slot']) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropState({
        imageSrc: reader.result as string,
        aspect,
        slot,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedFile: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (!cropState) return;

      if (cropState.slot === 'cover') {
        setCoverUrl(dataUrl);
      } else {
        const idx = cropState.slot;
        setCompCardUrls(prev => {
          const copy = [...prev];
          copy[idx] = dataUrl;
          return copy;
        });
      }
      setCropState(null);
      toast.success('Imagen recortada con éxito.');
    };
    reader.readAsDataURL(croppedFile);
  };

  const handleDeleteImage = (slot: CropState['slot']) => {
    if (slot === 'cover') {
      setCoverUrl(null);
    } else {
      setCompCardUrls(prev => {
        const copy = [...prev];
        copy[slot] = null;
        return copy;
      });
    }
    toast.info('Imagen eliminada.');
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    let fileName = (alias || 'compcard')
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .replace(/[^a-zA-Z0-9]/g, '_') // Solo alfanuméricos y guiones
      .replace(/_+/g, '_') // Consolidar guiones múltiples
      .replace(/^_|_$/g, '') // Quitar guiones al inicio/fin
      .toLowerCase();

    if (!fileName || fileName.length === 0) {
      fileName = 'compcard';
    }

    const wrapper = document.getElementById('compcard-wrapper');
    let originalWrapperStyle: Record<string, string> | null = null;

    const captureOptions = {
      quality: 0.95,
      pixelRatio: 2,
      skipFonts: true,
      fontEmbedCSS: '',
      style: {
        visibility: 'visible',
      },
      filter: (node: HTMLElement | Node): boolean => {
        if (node instanceof HTMLElement) {
          const tagName = node.tagName?.toLowerCase();
          if (tagName === 'script' || tagName === 'noscript') {
            return false;
          }
        }
        return true;
      },
      skipAutoScale: true,
      onImageErrorHandler: (event: unknown) => {
        console.warn('html-to-image onImageErrorHandler:', event);
      },
    };

    try {
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

      for (const t of targets) {
        const el = document.getElementById(t.id);
        if (!el) throw new Error(`Elementos necesarios no encontrados (${t.label}).`);
      }

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

      await new Promise(resolve => setTimeout(resolve, 100));

      // Esperar carga de imágenes
      const allImages: HTMLImageElement[] = [];
      targets.forEach(t => {
        const el = document.getElementById(t.id);
        if (el) allImages.push(...Array.from(el.getElementsByTagName('img')));
      });

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
            cleanup();
            finish();
          }, 5000);
        });
      }));

      await new Promise(resolve => setTimeout(resolve, 800));

      const { toJpeg, toPng } = await import('html-to-image');

      if (fileType === 'zip') {
        if (downloadFormat !== 'todos') {
          throw new Error('La descarga ZIP solo está disponible para "Todos los formatos".');
        }

        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (const t of targets) {
          const el = document.getElementById(t.id);
          if (!el) continue;

          const data = await toJpeg(el, captureOptions);
          if (data && data.startsWith('data:image/jpeg') && data.length > 1000) {
            zip.file(`${fileName}_${t.suffix}.jpg`, data.split(',')[1], { base64: true });
          }
        }

        const content = await zip.generateAsync({
          type: 'blob',
          mimeType: 'application/zip'
        });
        const url = URL.createObjectURL(content);

        const link = document.createElement('a');
        link.download = `${fileName}_completo.zip`;
        link.href = url;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);

      } else {
        const targetId = downloadFormat === 'todos' ? printContainerId : targets[0].id;
        const finalSuffix = downloadFormat === 'todos' ? 'hoja_completa' : downloadFormat;

        if (downloadFormat === 'todos' && fileType === 'pdf') {
          const { jsPDF } = await import('jspdf');
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'in',
            format: [11, 8.5]
          });

          const elFull = document.getElementById(printContainerId);
          if (elFull) {
            const dFull = await toJpeg(elFull, captureOptions);
            pdf.addImage(dFull, 'JPEG', 0, 0, 11, 8.5);
          }

          const elFront = document.getElementById(`${printContainerId}-front`);
          if (elFront) {
            pdf.addPage([5.5, 8.5], 'p');
            const dFront = await toJpeg(elFront, captureOptions);
            pdf.addImage(dFront, 'JPEG', 0, 0, 5.5, 8.5);
          }

          const elBack = document.getElementById(`${printContainerId}-back`);
          if (elBack) {
            pdf.addPage([5.5, 8.5], 'p');
            const dBack = await toJpeg(elBack, captureOptions);
            pdf.addImage(dBack, 'JPEG', 0, 0, 5.5, 8.5);
          }

          pdf.save(`${fileName}_book.pdf`);

        } else {
          const el = document.getElementById(targetId);
          if (!el) throw new Error('Elemento no encontrado');

          let dataUrl = '';
          if (fileType === 'png') dataUrl = await toPng(el, captureOptions);
          else dataUrl = await toJpeg(el, captureOptions);

          if (fileType === 'pdf') {
            const { jsPDF } = await import('jspdf');
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
            const link = document.createElement('a');
            link.download = `${fileName}_${finalSuffix}.${fileType}`;
            link.href = dataUrl;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
      }

      toast.success('Descarga completada con éxito.');

    } catch (error: unknown) {
      let errorMessage = 'Error desconocido';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        if ('isTrusted' in error) {
          errorMessage = 'Error de red o procesamiento al cargar las imágenes para la captura. Verifica las fotos e intenta de nuevo.';
        } else {
          try {
            const str = JSON.stringify(error, null, 2);
            if (str !== '{}') errorMessage = str;
          } catch {
            // ignore
          }
        }
      }
      console.error('Error en descarga:', errorMessage, error);
      toast.error('Error al generar la compcard', { description: errorMessage });
    } finally {
      if (wrapper && originalWrapperStyle) {
        Object.assign(wrapper.style, originalWrapperStyle);
      }
      setIsDownloading(false);
    }
  };

  // Mock Model Object for Screen Preview and Print Template
  const mockModel = {
    id: 'client-gen-id',
    alias: alias || 'Alias',
    full_name: alias || 'MODELO',
    gender: gender,
    height_cm: height ? Number(height) : null,
    shoulders_cm: shoulders ? Number(shoulders) : null,
    chest_cm: gender === 'Male' && bustChest ? Number(bustChest) : null,
    bust_cm: gender === 'Female' && bustChest ? Number(bustChest) : null,
    waist_cm: waist ? Number(waist) : null,
    hips_cm: hips ? Number(hips) : null,
    top_size: topSize || null,
    pants_size: pantsSize || null,
    shoe_size_us: shoeSize ? Number(shoeSize) : null,
    country: country || 'GUATEMALA',
    coverUrl: coverUrl,
    compCardUrls: compCardUrls,
  } as unknown as Model & { coverUrl?: string | null; compCardUrls?: (string | null)[] };

  const preventNonNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isControlKey = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey;
    const isDigitOrDot = /[0-9.]/.test(e.key);
    if (!isDigitOrDot && !isControlKey) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto p-6 space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-2 pb-4 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-display font-semibold flex items-center gap-2">
            Generador de Compcards
          </h1>
        </div>
      </header>

      {/* Desktop side-by-side / Mobile layout using standard responsive classes */}
      <div className="hidden lg:grid grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Settings */}
        <div className="col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Datos del Talento
              </CardTitle>
              <CardDescription>Completa solo los datos que irán en la compcard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="alias-ds">Nombre/Alias</Label>
                  <Input id="alias-ds" value={alias} onChange={e => setAlias(e.target.value)} placeholder="Ej: Sofía" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gender-ds">Género</Label>
                  <Select value={gender} onValueChange={(val: 'Male' | 'Female') => {
                    setGender(val);
                    setBustChest('');
                  }}>
                    <SelectTrigger id="gender-ds">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="country-ds">País en Compcard</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger id="country-ds">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(c => (
                        <SelectItem key={c.value} value={c.value.toUpperCase()}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="height-ds">Estatura (CM)</Label>
                  <Input id="height-ds" type="number" onKeyDown={preventNonNumericInput} value={height} onChange={e => setHeight(e.target.value)} placeholder="Ej: 175" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="shoulders-ds">Hombros (CM)</Label>
                  <Input id="shoulders-ds" type="number" onKeyDown={preventNonNumericInput} value={shoulders} onChange={e => setShoulders(e.target.value)} placeholder="Ej: 38" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bustchest-ds">{gender === 'Female' ? 'Busto (CM)' : 'Pecho (CM)'}</Label>
                  <Input id="bustchest-ds" type="number" onKeyDown={preventNonNumericInput} value={bustChest} onChange={e => setBustChest(e.target.value)} placeholder={gender === 'Female' ? 'Ej: 90' : 'Ej: 98'} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="waist-ds">Cintura (CM)</Label>
                  <Input id="waist-ds" type="number" onKeyDown={preventNonNumericInput} value={waist} onChange={e => setWaist(e.target.value)} placeholder="Ej: 64" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="hips-ds">Cadera (CM)</Label>
                  <Input id="hips-ds" type="number" onKeyDown={preventNonNumericInput} value={hips} onChange={e => setHips(e.target.value)} placeholder="Ej: 92" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="top-ds">Top</Label>
                  <Select value={topSize} onValueChange={setTopSize}>
                    <SelectTrigger id="top-ds">
                      <SelectValue placeholder="Talla" />
                    </SelectTrigger>
                    <SelectContent>
                      {topSizeOptions.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pants-ds">Jeans</Label>
                  <Select value={pantsSize} onValueChange={setPantsSize}>
                    <SelectTrigger id="pants-ds">
                      <SelectValue placeholder="Talla" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-</SelectItem>
                      {(gender === 'Female' ? femalePantsSizeOptions : malePantsSizeOptions).map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="shoes-ds">Zapatos (US)</Label>
                  <Select value={shoeSize} onValueChange={setShoeSize}>
                    <SelectTrigger id="shoes-ds">
                      <SelectValue placeholder="Talla" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => Number((3.5 + i * 0.5).toFixed(1))).map(s => (
                        <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Fotos de la Compcard
              </CardTitle>
              <CardDescription>Sube y recorta fotos para la portada y contraportada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-body font-medium text-muted-foreground mb-2 block">Portada (Slider) - Ratio 3:4</span>
                <PhotoSlot
                  className="aspect-3/4"
                  imageUrl={coverUrl}
                  onFileSelect={(file) => handleFileSelect(file, 3 / 4, 'cover')}
                  onDelete={() => handleDeleteImage('cover')}
                  label="Subir Foto de Portada"
                />
              </div>

              <div>
                <span className="text-body font-medium text-muted-foreground mb-2 block">Contraportada (3 Fotos) - Ratio 735:1031</span>
                <div className="grid grid-cols-2 gap-4">
                  {/* Slot 0 */}
                  <PhotoSlot
                    className="aspect-[735/1031]"
                    imageUrl={compCardUrls[0]}
                    onFileSelect={(file) => handleFileSelect(file, 735 / 1031, 0)}
                    onDelete={() => handleDeleteImage(0)}
                    label="Subir Foto 1"
                  />
                  {/* Slot 1: Reserved for Info */}
                  <div className="aspect-[735/1031] bg-quaternary border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center p-4 text-center">
                    <span className="text-muted-foreground/45 text-label flex flex-col items-center gap-1">
                      <Info className="h-4 w-4 text-muted-foreground/30" />
                      Reservado para Información
                    </span>
                  </div>
                  {/* Slot 2 */}
                  <PhotoSlot
                    className="aspect-[735/1031]"
                    imageUrl={compCardUrls[2]}
                    onFileSelect={(file) => handleFileSelect(file, 735 / 1031, 2)}
                    onDelete={() => handleDeleteImage(2)}
                    label="Subir Foto 2"
                  />
                  {/* Slot 3 */}
                  <PhotoSlot
                    className="aspect-[735/1031]"
                    imageUrl={compCardUrls[3]}
                    onFileSelect={(file) => handleFileSelect(file, 735 / 1031, 3)}
                    onDelete={() => handleDeleteImage(3)}
                    label="Subir Foto 3"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                Descargar Compcard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    if (val === 'todos') {
                      setFileType('zip');
                    } else if (fileType === 'zip') {
                      setFileType('png');
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-10 transition-colors">
                    <SelectValue placeholder="Selecciona formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoja_completa">Hoja completa (Ambas caras)</SelectItem>
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
                  <SelectTrigger className="w-full h-10 transition-colors">
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

              <div className="pt-2">
                <Button
                  className="w-full h-11 font-bold text-body"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando descarga...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Descargar Compcard
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sticky Live Preview */}
        <div className="col-span-7 sticky top-4 space-y-4">
          <div className="border rounded-xl bg-sys-bg-secondary p-8 shadow-inner overflow-hidden flex items-center justify-center">
            <PreviewScaleWrapper>
              <CompCardPrintTemplate model={mockModel} containerId="preview-compcard-print" />
            </PreviewScaleWrapper>
          </div>
        </div>
      </div>

      {/* Mobile view with focused tabs */}
      <div className="lg:hidden block">
        <Tabs defaultValue="form" className="w-full">
          <TabsList className="grid grid-cols-3 w-full h-11 mb-6">
            <TabsTrigger value="form" className="text-label flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Datos
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-label flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Vista Previa
            </TabsTrigger>
            <TabsTrigger value="download" className="text-label flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Descargar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-6 outline-none">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-body flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Datos del Talento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="alias-mb">Nombre/Alias</Label>
                    <Input id="alias-mb" value={alias} onChange={e => setAlias(e.target.value)} placeholder="Ej: Sofía" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="gender-mb">Género</Label>
                    <Select value={gender} onValueChange={(val: 'Male' | 'Female') => {
                      setGender(val);
                      setBustChest('');
                    }}>
                      <SelectTrigger id="gender-mb">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="country-mb">País en Compcard</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger id="country-mb">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(c => (
                          <SelectItem key={c.value} value={c.value.toUpperCase()}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="height-mb">Estatura (CM)</Label>
                    <Input id="height-mb" type="number" onKeyDown={preventNonNumericInput} value={height} onChange={e => setHeight(e.target.value)} placeholder="Ej: 175" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="shoulders-mb">Hombros (CM)</Label>
                    <Input id="shoulders-mb" type="number" onKeyDown={preventNonNumericInput} value={shoulders} onChange={e => setShoulders(e.target.value)} placeholder="Ej: 38" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bustchest-mb">{gender === 'Female' ? 'Busto (CM)' : 'Pecho (CM)'}</Label>
                    <Input id="bustchest-mb" type="number" onKeyDown={preventNonNumericInput} value={bustChest} onChange={e => setBustChest(e.target.value)} placeholder={gender === 'Female' ? 'Ej: 90' : 'Ej: 98'} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="waist-mb">Cintura (CM)</Label>
                    <Input id="waist-mb" type="number" onKeyDown={preventNonNumericInput} value={waist} onChange={e => setWaist(e.target.value)} placeholder="Ej: 64" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="hips-mb">Cadera (CM)</Label>
                    <Input id="hips-mb" type="number" onKeyDown={preventNonNumericInput} value={hips} onChange={e => setHips(e.target.value)} placeholder="Ej: 92" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="top-mb">Top</Label>
                    <Select value={topSize} onValueChange={setTopSize}>
                      <SelectTrigger id="top-mb">
                        <SelectValue placeholder="Talla" />
                      </SelectTrigger>
                      <SelectContent>
                        {topSizeOptions.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pants-mb">Jeans</Label>
                    <Select value={pantsSize} onValueChange={setPantsSize}>
                      <SelectTrigger id="pants-mb">
                        <SelectValue placeholder="Talla" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-</SelectItem>
                        {(gender === 'Female' ? femalePantsSizeOptions : malePantsSizeOptions).map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="shoes-mb">Zapatos (US)</Label>
                    <Select value={shoeSize} onValueChange={setShoeSize}>
                      <SelectTrigger id="shoes-mb">
                        <SelectValue placeholder="Talla" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => Number((3.5 + i * 0.5).toFixed(1))).map(s => (
                          <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-body flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  Fotos de la Compcard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-body font-medium text-muted-foreground mb-2 block">Portada (Slider) - Ratio 3:4</span>
                  <PhotoSlot
                    className="aspect-3/4"
                    imageUrl={coverUrl}
                    onFileSelect={(file) => handleFileSelect(file, 3 / 4, 'cover')}
                    onDelete={() => handleDeleteImage('cover')}
                    label="Subir Portada"
                  />
                </div>

                <div>
                  <span className="text-body font-medium text-muted-foreground mb-2 block">Contraportada (3 Fotos) - Ratio 735:1031</span>
                  <div className="grid grid-cols-2 gap-4">
                    <PhotoSlot
                      className="aspect-[735/1031]"
                      imageUrl={compCardUrls[0]}
                      onFileSelect={(file) => handleFileSelect(file, 735 / 1031, 0)}
                      onDelete={() => handleDeleteImage(0)}
                      label="Subir Foto 1"
                    />
                    <div className="aspect-[735/1031] bg-quaternary border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center p-2 text-center">
                      <span className="text-muted-foreground/45 text-label flex flex-col items-center gap-1 leading-tight">
                        <Info className="h-3.5 w-3.5 text-muted-foreground/30" />
                        Reservado para Info
                      </span>
                    </div>
                    <PhotoSlot
                      className="aspect-[735/1031]"
                      imageUrl={compCardUrls[2]}
                      onFileSelect={(file) => handleFileSelect(file, 735 / 1031, 2)}
                      onDelete={() => handleDeleteImage(2)}
                      label="Subir Foto 2"
                    />
                    <PhotoSlot
                      className="aspect-[735/1031]"
                      imageUrl={compCardUrls[3]}
                      onFileSelect={(file) => handleFileSelect(file, 735 / 1031, 3)}
                      onDelete={() => handleDeleteImage(3)}
                      label="Subir Foto 3"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 outline-none">
            <div className="border rounded-xl bg-sys-bg-secondary p-4 shadow-inner overflow-hidden">
              <PreviewScaleWrapper>
                <CompCardPrintTemplate model={mockModel} containerId="preview-compcard-print-mb" />
              </PreviewScaleWrapper>
            </div>
          </TabsContent>

          <TabsContent value="download" className="space-y-4 outline-none">
            <Card>
              <CardHeader>
                <CardTitle className="text-body">Opciones de Descarga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-label font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    Qué descargar
                  </Label>
                  <Select
                    value={downloadFormat}
                    onValueChange={(v) => {
                      const val = v as typeof downloadFormat;
                      setDownloadFormat(val);
                      if (val === 'todos') {
                        setFileType('zip');
                      } else if (fileType === 'zip') {
                        setFileType('png');
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-10">
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
                  <Label className="text-label font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <FileType className="h-3.5 w-3.5" />
                    Formato de archivo
                  </Label>
                  <Select value={fileType} onValueChange={(v) => setFileType(v as typeof fileType)}>
                    <SelectTrigger className="w-full h-10">
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

                <div className="pt-2">
                  <Button
                    className="w-full h-11 font-bold text-body"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Descargando...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Compcard
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Crop Dialog */}
      {cropState && (
        <ImageCropDialog
          imageSrc={cropState.imageSrc}
          aspect={cropState.aspect}
          onCropComplete={handleCropComplete}
          onClose={() => setCropState(null)}
        />
      )}

      {/* Offscreen print template */}
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
        <div style={{ width: '3300px', height: '2550px', backgroundColor: 'rgb(255, 255, 255)' }}>
          <CompCardPrintTemplate
            model={mockModel}
            containerId={printContainerId}
          />
        </div>
      </div>
    </div>
  );
}
