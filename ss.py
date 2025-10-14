import os

# --- CONTENIDO DE LOS ARCHIVOS CORREGIDOS ---
# Este diccionario contiene las rutas relativas de los archivos y su nuevo contenido completo.
file_contents = {
    # 1. API Route para OBTENER imágenes (Solo GET)
    'src/app/api/models/[modelId]/route.ts': r"""
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic'; // <-- CORRECCIÓN: Asegura que la ruta sea siempre dinámica

const BUCKET_NAME = 'models'; // <-- RECUERDA CAMBIAR SI TU BUCKET SE LLAMA DIFERENTE

// --- FUNCIÓN GET para obtener las URLs firmadas ---
export async function GET(
  req: Request,
  { params }: { params: { modelId: string } }
) {
  const supabase = createClient();
  const { modelId } = params;

  if (!modelId) {
    return NextResponse.json({ success: false, error: 'Model ID is required.' }, { status: 400 });
  }

  let coverUrl: string | null = null;
  let compCardUrls: string[] = [];

  // 1. Intentar obtener la URL de la portada
  const { data: coverSignedUrl, error: coverError } = await supabase
    .storage
    .from(BUCKET_NAME)
    .createSignedUrl(`${modelId}/Portada/cover.jpg`, 300); // 5 minutos de validez

  if (coverError && coverError.message.includes('not found')) {
    // Es normal que no se encuentre, no es un error fatal.
  } else if (coverError) {
    console.error(`Error al obtener URL de portada para ${modelId}:`, coverError);
  } else if (coverSignedUrl) {
    coverUrl = coverSignedUrl.signedUrl;
  }

  // 2. Intentar obtener las URLs de la contraportada
  const { data: fileList, error: listError } = await supabase
    .storage
    .from(BUCKET_NAME)
    .list(`${modelId}/Contraportada/`, {
      limit: 4,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (listError) {
    console.error(`Error al listar contraportadas para ${modelId}:`, listError);
  }

  if (fileList && fileList.length > 0) {
    const filePaths = fileList.map(file => `${modelId}/Contraportada/${file.name}`);
    const { data: signedUrlsData, error: signedUrlError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .createSignedUrls(filePaths, 300);

    if (signedUrlError) {
      console.error(`Error al firmar URLs de contraportada para ${modelId}:`, signedUrlError);
    } else if (signedUrlsData) {
      compCardUrls = signedUrlsData.map(item => item?.signedUrl).filter(Boolean) as string[];
    }
  }
  
  // 3. Devolver siempre una respuesta JSON válida
  return NextResponse.json({
    success: true,
    coverUrl,
    compCardUrls,
  });
}
""",
    # 2. NUEVA API Route para SUBIR y BORRAR (POST y DELETE)
    'src/app/api/models/[modelId]/storage/route.ts': r"""
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic'; // <-- CORRECCIÓN: Asegura que la ruta sea siempre dinámica

const BUCKET_NAME = 'models'; // <-- RECUERDA CAMBIAR SI TU BUCKET SE LLAMA DIFERENTE

// --- FUNCIÓN POST para subir archivos ---
export async function POST(
  req: Request,
  { params }: { params: { modelId: string } }
) {
  const supabase = createClient();
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const type = formData.get('type') as 'cover' | 'comp-card';
  const slotIndex = formData.get('slotIndex') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'No se encontró el archivo.' }, { status: 400 });
  }

  let filePath = '';
  if (type === 'cover') {
    filePath = `${params.modelId}/Portada/cover.jpg`;
  } else if (type === 'comp-card' && slotIndex !== null) {
    filePath = `${params.modelId}/Contraportada/comp_${slotIndex}.jpg`;
  } else {
    return NextResponse.json({ error: 'Tipo de imagen o índice no válido.' }, { status: 400 });
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Esto permite sobreescribir si ya existe
    });

  if (error) {
    console.error('Supabase upload error:', error);
    return NextResponse.json({ error: 'Error al subir el archivo a Supabase.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, path: filePath });
}


// --- FUNCIÓN DELETE para borrar archivos ---
export async function DELETE(
  req: Request,
  { params }: { params: { modelId: string } }
) {
    const supabase = createClient();
    const { filePath } = await req.json();

    if (!filePath) {
        return NextResponse.json({ error: 'Falta la ruta del archivo a eliminar.' }, { status: 400 });
    }

    // Medida de seguridad: solo permitir borrar archivos dentro de la carpeta del modelo actual
    if (!filePath.startsWith(params.modelId)) {
        return NextResponse.json({ error: 'No tienes permiso para eliminar este archivo.' }, { status: 403 });
    }

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

    if (error) {
        console.error('Supabase delete error:', error);
        return NextResponse.json({ error: 'Error al eliminar el archivo de Supabase.' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
}
""",
    # 3. Componente Hijo, sin cambios respecto a la versión anterior pero incluido por completitud
    'src/components/organisms/CompCardManager.tsx': r"""
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
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingState, setUploadingState] = useState({ cover: false, compCards: [false, false, false, false] });

    // Función para recargar las imágenes desde la API GET
    const loadImages = async () => {
      if (!modelId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/models/${modelId}`); // Llama a la API de GET
        const data = await response.json();
        if (data.success) {
          setCoverUrl(data.coverUrl || null);
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

    const handleUpload = async (file: File, type: 'cover' | 'comp-card', slotIndex?: number) => {
        if (type === 'cover') setUploadingState(p => ({ ...p, cover: true }));
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
            else if (slotIndex !== undefined) setUploadingState(p => {
                const newCompCards = [...p.compCards]; newCompCards[slotIndex] = false;
                return { ...p, compCards: newCompCards };
            });
        }
    };

    const handleDelete = async (type: 'cover' | 'comp-card', slotIndex?: number) => {
        const filePath = type === 'cover' 
            ? `${modelId}/Portada/cover.jpg` 
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
                <CardTitle>Gestión de Comp Card</CardTitle>
                <CardDescription>Sube y administra las imágenes de portada y contraportada.</CardDescription>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <span className="text-sm font-medium text-muted-foreground mb-2 block">Portada</span>
                        <PhotoSlot className="aspect-[3/4]" imageUrl={coverUrl} onFileSelect={(file) => handleUpload(file, 'cover')} onDelete={() => handleDelete('cover')} label="Subir Portada" isUploading={uploadingState.cover}/>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-muted-foreground mb-2 block">Contraportada</span>
                        <div className="grid grid-cols-2 gap-4">
                            {compCardUrls.map((url, index) => (
                                <PhotoSlot key={index} className="aspect-square" imageUrl={url} onFileSelect={(file) => handleUpload(file, 'comp-card', index)} onDelete={() => handleDelete('comp-card', index)} label={`Foto ${index + 1}`} isUploading={uploadingState.compCards[index]}/>
                            ))}
                        </div>
                    </div>
                </div>
                )}
            </CardContent>
        </Card>
    );
}
"""
}

# --- SCRIPT DE EJECUCIÓN ---
def apply_fixes():
    """
    Recorre el diccionario file_contents y aplica los cambios a los archivos del proyecto.
    """
    project_root = os.getcwd()
    print(f"Ejecutando script en el directorio: {project_root}\n")

    for relative_path, new_content in file_contents.items():
        # Normalizamos la ruta para que funcione en Windows, Mac y Linux
        full_path = os.path.join(project_root, *relative_path.split('/'))
        
        try:
            # Asegurarse de que el directorio exista
            dir_name = os.path.dirname(full_path)
            if not os.path.exists(dir_name):
                os.makedirs(dir_name)
                print(f"Directorio creado: {dir_name}")

            # Escribir el nuevo contenido en el archivo
            with open(full_path, 'w', encoding='utf-8', newline='\n') as f:
                f.write(new_content.strip())
            
            print(f"✅ Archivo actualizado con éxito: {relative_path}")

        except Exception as e:
            print(f"❌ Error al actualizar el archivo {relative_path}: {e}")

if __name__ == "__main__":
    print("--- Iniciando la corrección automática del proyecto ---")
    apply_fixes()
    print("\n--- Proceso completado. ---")
    print("Se han actualizado los archivos. Por favor, reinicia tu servidor de desarrollo.")

