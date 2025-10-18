import os

# --- INICIO DE LA CONFIGURACIÓN ---

# Define la ruta base de tu proyecto.
# Si ejecutas este script desde la raíz de tu proyecto NYXA, déjalo como está.
# De lo contrario, cámbialo a la ruta completa, por ejemplo: "C:/Users/TuUsuario/Desktop/nyxa"
PROJECT_BASE_PATH = "." 

# --- FIN DE LA CONFIGURACIÓN ---

# Diccionario que mapea la ruta del archivo al nuevo contenido.
# Las rutas son relativas a PROJECT_BASE_PATH.
corrections = {
    "src/app/api/models/[modelId]/route.ts": r"""
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const BUCKET_NAME = 'Book_Completo_iZ_Management';

export async function GET(
  req: Request,
  context: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await context.params;
    const supabase = await createClient();

    if (!supabase) {
      throw new Error('No se pudo inicializar el cliente de Supabase.');
    }

    if (!modelId) {
      return NextResponse.json(
        { success: false, error: 'Model ID is required.' },
        { status: 400 }
      );
    }

    let coverUrl: string | null = null;
    let compCardUrls: string[] = [];
    let portfolioUrl: string | null = null;

    const { data: coverList, error: coverListError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(`${modelId}/Portada/`, { limit: 1 });

    if (coverListError) {
      console.error(`❌ Error al listar portada para ${modelId}:`, coverListError);
    } else if (coverList && coverList.length > 0) {
      const coverPath = `${modelId}/Portada/${coverList[0].name}`;
      const { data: coverSignedUrl, error: coverError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrl(coverPath, 300);
      if (coverError) {
        console.error(`❌ Error al firmar URL de portada para ${modelId}:`, coverError);
      } else {
        coverUrl = coverSignedUrl?.signedUrl ?? null;
      }
    }

    const { data: portfolioList, error: portfolioListError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(`${modelId}/Portfolio/`, { limit: 1 });

    if (portfolioListError) {
      console.error(`❌ Error al listar portafolio para ${modelId}:`, portfolioListError);
    } else if (portfolioList && portfolioList.length > 0) {
      const portfolioPath = `${modelId}/Portfolio/${portfolioList[0].name}`;
      const { data: portfolioSignedUrl, error: portfolioError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrl(portfolioPath, 300);
      if (portfolioError) {
        console.error(`❌ Error al firmar URL de portafolio para ${modelId}:`, portfolioError);
      } else {
        portfolioUrl = portfolioSignedUrl?.signedUrl ?? null;
      }
    }

    const { data: fileList, error: listError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(`${modelId}/Contraportada/`, {
        limit: 4,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError) {
      console.error(`❌ Error al listar contraportadas para ${modelId}:`, listError);
    }

    if (fileList && fileList.length > 0) {
      const filePaths = fileList.map(file => `${modelId}/Contraportada/${file.name}`);
      const { data: signedUrlsData, error: signedUrlError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrls(filePaths, 300);

      if (signedUrlError) {
        console.error(`❌ Error al firmar URLs de contraportada para ${modelId}:`, signedUrlError);
      } else if (signedUrlsData) {
        compCardUrls = signedUrlsData
          .map(item => item?.signedUrl)
          .filter(Boolean) as string[];
      }
    }

    return NextResponse.json({
      success: true,
      coverUrl,
      portfolioUrl,
      compCardUrls,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    console.error('🔥 Error general en /api/models/[modelId]:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
""",
    "src/app/c/[public_id]/_components/PasswordProtect.tsx": r"""
'use client'

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { verifyProjectPassword } from '@/lib/actions/projects';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface PasswordProtectProps {
  projectId: string;
  projectName: string;
}

export default function PasswordProtect({ projectId, projectName }: PasswordProtectProps) {
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await verifyProjectPassword(projectId, password);
      if (result.success) {
        toast.success('Acceso concedido. ¡Bienvenido!');
        router.refresh();
      } else {
        toast.error(result.error || 'Ocurrió un error.');
      }
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lock className="size-6" />
            </div>
          <CardTitle>Proyecto Protegido</CardTitle>
          <CardDescription>
            Ingresa la contraseña para acceder a la selección del proyecto &quot;{projectName}&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Verificando...' : 'Acceder'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
""",
    "src/app/dashboard/models/[id]/page-client.tsx": r"""
'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Model } from '../../../../lib/types';
import { ModelFormData } from '../../../../lib/schemas';
import { updateModel } from '../../../../lib/actions/models';
import { type SubmitHandler } from 'react-hook-form';
import { Button } from '../../../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { ChevronLeft, FilePenLine } from 'lucide-react';
import { DeleteModelDialog } from '../../../../components/organisms/DeleteModelDialog';
import { ModelForm } from '../../../../components/organisms/ModelForm';
import { CompCardManager } from '../../../../components/organisms/CompCardManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const DataPoint = ({ label, value, children }: { label: string, value?: string | number | null, children?: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <Label className="text-sm font-normal text-muted-foreground">{label}</Label>
    {children ? (
      <div className="text-foreground">{children}</div>
    ) : (
      <p className="text-foreground">{value || '—'}</p>
    )}
  </div>
);

const StaticInfoDisplay = ({ model }: { model: Model }) => (
  <div className="space-y-8">
    <Card>
      <CardHeader>
        <CardTitle>Información Básica</CardTitle>
        <CardDescription>Datos personales y de identificación.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
        <DataPoint label="Nombre Completo" value={model.full_name} />
        <DataPoint label="Fecha de Nacimiento" value={model.birth_date} />
        <DataPoint label="País" value={model.country} />
        <DataPoint label="Documento ID" value={model.national_id} />
        <DataPoint label="Género" value={model.gender} />
      </CardContent>
    </Card>
  </div>
);

const DangerZone = ({ modelId, modelAlias }: { modelId: string, modelAlias: string }) => (
  <Card className="border-destructive">
    <CardHeader>
      <CardTitle className="text-destructive">Danger Zone</CardTitle>
      <CardDescription>La acción en esta zona es permanente.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/5 p-4">
        <div>
          <p className="font-semibold text-foreground">Eliminar este talento</p>
          <p className="text-sm text-muted-foreground">Todos los datos se perderán.</p>
        </div>
        <DeleteModelDialog modelId={modelId} modelAlias={modelAlias}>
          <Button variant="destructive">Eliminar</Button>
        </DeleteModelDialog>
      </div>
    </CardContent>
  </Card>
);

export default function ModelProfilePageClient({ initialModel }: { initialModel: Model | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [model, setModel] = useState(initialModel);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(true);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!model?.id) return;
      setAvatarLoading(true);

      try {
        const response = await fetch(`/api/models/${model.id}`);
        let data: { success: boolean, coverUrl?: string | null } | null = null;

        try {
          data = await response.json();
        } catch {
          console.error('⚠️ Respuesta no era JSON o venía vacía');
        }

        if (!response.ok) {
          console.error('❌ Error HTTP al obtener avatar:', response.status, data);
          throw new Error(`Failed to fetch avatar (${response.status})`);
        }

        if (data?.success && data?.coverUrl) {
          setAvatarUrl(`${data.coverUrl}&t=${Date.now()}`);
        } else {
          setAvatarUrl(null);
        }

      } catch (error) {
        console.error('🚨 Error fetching avatar:', error);
        setAvatarUrl(null);
      } finally {
        setAvatarLoading(false);
      }
    };

    fetchAvatar();
  }, [model?.id]);

  if (!model) {
    return (
      <div className="text-center py-20">
        <p>No se encontró el modelo.</p>
      </div>
    );
  }

  const handleSubmit: SubmitHandler<ModelFormData> = async (data) => {
    setIsSubmitting(true);
    const result = await updateModel(model.id, data);

    if (result.success) {
      toast.success('Perfil actualizado!');
      const dataForState = { ...data, pants_size: data.pants_size !== null ? String(data.pants_size) : null };
      setModel({ ...model, ...dataForState });
      setIsEditing(false);
    } else {
      toast.error('Error al actualizar', { description: result.error });
    }
    setIsSubmitting(false);
  };

  const fallbackText = model.alias?.substring(0, 2) || 'IZ';

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" asChild>
            <Link href="/dashboard/models">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>

          <div className="flex items-center gap-4">
            {avatarLoading ? (
              <Skeleton className="h-16 w-16 rounded-full hidden sm:flex" />
            ) : (
              <Avatar className="h-16 w-16 hidden sm:flex">
                <AvatarImage src={avatarUrl || ''} alt={model.alias || 'Avatar'} />
                <AvatarFallback className="text-xl">{fallbackText}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{model.alias}</h1>
              <p className="text-muted-foreground">{model.full_name}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button form="model-edit-form" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <FilePenLine className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full space-y-12">
        {isEditing ? (
          <ModelForm model={model} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        ) : (
          <>
            <StaticInfoDisplay model={model} />
            <div className="grid gap-8">
              <CompCardManager modelId={model.id} />
            </div>
            <DangerZone modelId={model.id} modelAlias={model.alias || 'este modelo'} />
          </>
        )}
      </main>
    </div>
  );
}
""",
    "src/app/login/page.tsx": r"""
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/organisms/LoginForm";
import Image from 'next/image';
import Link from 'next/link';

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard/models');
  }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Link href="/" className="flex items-center justify-center gap-2 font-semibold text-lg">
              <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-5" />
              </div>
              IZ Access
            </Link>
            <p className="text-balance text-muted-foreground mt-2">
              Bienvenido de nuevo. Accede a tu panel de gestión.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>

      <div className="hidden lg:block relative">
        <Image
            src="/images/JMTS_13.jpg"
            alt="Imagen decorativa de la página de inicio de sesión"
            fill
            className="object-cover"
            priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 text-white">
            <h2 className="text-3xl font-bold">Tu Visión, Nuestro Talento</h2>
            <p className="text-white/80 mt-2">La plataforma exclusiva para la gestión de talentos de IZ Management.</p>
        </div>
      </div>
    </div>
  );
}
""",
    "src/components/molecules/InfoFooter.tsx": r"""
"use client";
import React from 'react';

const infoFooterStyles = {
  infoFooter: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    width: '100%',
    fontSize: 'var(--md-typescale-body-small-size)',
    textTransform: 'uppercase' as 'uppercase',
  },
  left: { justifySelf: 'start' as const },
  center: { justifySelf: 'center' as const },
  right: { justifySelf: 'end' as const },
};

interface InfoFooterProps {
    time: string;
}

const InfoFooter = ({ time }: InfoFooterProps) => {
  return (
    <div style={infoFooterStyles.infoFooter}>
      <div style={infoFooterStyles.left}>
        <span>Villa Nueva, Guatemala</span>
      </div>
      <div style={infoFooterStyles.center}>
        <span>{time}</span>
      </div>
      <div style={infoFooterStyles.right}>
        <span>Developed by Skopos</span>
      </div>
    </div>
  );
};

export default InfoFooter;
""",
    "src/components/organisms/CompCardManager.tsx": r"""
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

    const loadImages = async () => {
      if (!modelId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/models/${modelId}`);
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
            const response = await fetch(`/api/models/${modelId}/storage`, { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Respuesta no válida del servidor');
            toast.success('Imagen subida correctamente.');
            await loadImages();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Ocurrió un error.';
            toast.error('Error al subir la imagen', { description: message });
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
            const response = await fetch(`/api/models/${modelId}/storage`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Respuesta no válida del servidor');
            toast.success('Imagen eliminada.');
            await loadImages();
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
""",
    "src/components/organisms/LoginForm.tsx": r"""
"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/useAuth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Ocurrió un error al iniciar sesión.');
      if (error.message.includes("Invalid login credentials")) {
        setError("Correo o contraseña incorrectos.");
      }
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-sm gap-6">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="nombre@ejemplo.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button disabled={loading} className="w-full">
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </Button>
        </form>
    </div>
  );
}
""",
    "src/components/ui/command.tsx": r"""
"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

type CommandDialogProps = DialogProps;

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm" {...props} />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
}
""",
    "src/components/ui/input.tsx": r"""
import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-primary",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
""",
    "src/components/ui/textarea.tsx": r"""
import * as React from "react"

import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
""",
    "src/lib/actions/projects.ts": r"""
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { projectFormSchema } from '../schemas/projects';
import { z } from 'zod';
import { Project } from '@/lib/types';
import { cookies } from 'next/headers';

type FormState = {
  error: string | null;
  success: boolean;
  data?: Record<string, FormDataEntryValue | undefined>;
};

export async function createProject(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { success: false, error: 'No se pudo autenticar al usuario.' }; }
  const rawData = Object.fromEntries(formData.entries());
  const validation = projectFormSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errorMessage = Object.values(fieldErrors).flat().join('. ');
    return { success: false, error: errorMessage || 'Los datos enviados no son válidos.', data: rawData };
  }
  const { password, ...projectData } = validation.data;
  const dataToInsert = { ...projectData, password: password || null, user_id: user.id };
  const { data: newProject, error } = await supabase.from('projects').insert(dataToInsert).select('id').single();
  if (error) {
    console.error('Supabase insert error:', error);
    return { success: false, error: 'Error de base de datos al crear el proyecto.' };
  }
  revalidatePath('/dashboard/projects');
  redirect(`/dashboard/projects/${newProject.id}`);
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  if (!z.string().uuid().safeParse(projectId).success) { return { success: false, error: 'ID de proyecto inválido.' }; }
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) {
    console.error('Supabase delete error:', error);
    return { success: false, error: 'Error de base de datos al eliminar el proyecto.' };
  }
  revalidatePath('/dashboard/projects');
  return { success: true };
}

export async function updateProjectStatus(projectId: string, newStatus: Project['status']) {
  const supabase = await createClient();
  if (!z.string().uuid().safeParse(projectId).success) { return { success: false, error: 'ID de proyecto inválido.' }; }
  const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', projectId);
  if (error) {
    console.error('Supabase status update error:', error);
    return { success: false, error: 'No se pudo actualizar el estado del proyecto.' };
  }
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath('/dashboard/projects');
  return { success: true };
}

export async function verifyProjectPassword(projectId: string, password_input: string) {
  const supabase = await createClient();
  const { data: project, error } = await supabase.from('projects').select('password').eq('id', projectId).single();

  if (error || !project) {
    return { success: false, error: 'Proyecto no encontrado.' };
  }

  if (project.password === password_input) {
    const cookieName = `project_access_${projectId}`;
    const cookieStore = cookies();
    cookieStore.set(cookieName, 'true', { maxAge: 60 * 60 * 24, httpOnly: true, path: '/' });
    return { success: true };
  } else {
    return { success: false, error: 'Contraseña incorrecta.' };
  }
}
""",
    "src/lib/api/projects.ts": r"""
'use server';

import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model, Project } from "@/lib/types";

const BUCKET_NAME = 'Book_Completo_iZ_Management';
const ITEMS_PER_PAGE = 10;

type SearchParams = {
  query?: string;
  year?: string;
  month?: string;
  sortKey?: keyof Project;
  sortDir?: 'asc' | 'desc';
  currentPage?: number;
  limit?: number;
};

export async function getProjectsForUser(searchParams: SearchParams = {}) {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('No user logged in');
    return { data: [], count: 0 };
  }

  const currentPage = searchParams.currentPage || 1;
  const limit = searchParams.limit || ITEMS_PER_PAGE;

  let queryBuilder = supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);

  if (searchParams.query) {
    const searchQuery = `%${searchParams.query}%`;
    queryBuilder = queryBuilder.or(
      `project_name.ilike.${searchQuery},client_name.ilike.${searchQuery}`
    );
  }

  if (searchParams.year && searchParams.month) {
    const year = parseInt(searchParams.year);
    const month = parseInt(searchParams.month);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    queryBuilder = queryBuilder.gte('created_at', startDate).lte('created_at', endDate);
  } else if (searchParams.year) {
    const year = parseInt(searchParams.year);
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();
     queryBuilder = queryBuilder.gte('created_at', startDate).lte('created_at', endDate);
  }

  const sortKey = searchParams.sortKey || 'created_at';
  const sortDir = searchParams.sortDir || 'desc';
  queryBuilder = queryBuilder.order(sortKey, { ascending: sortDir === 'asc' });

  const from = (currentPage - 1) * limit;
  const to = from + limit - 1;
  queryBuilder = queryBuilder.range(from, to);

  const { data, error, count } = await queryBuilder;

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Could not fetch projects data.');
  }

  return { data: data || [], count: count || 0 };
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .or(`id.eq.${projectId},public_id.eq.${projectId}`)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }
  return data as Project;
}

export async function getModelsForProject(projectId: string): Promise<Model[]> {
  noStore();
  const supabase = await createClient();

  const { data: projectModelsData, error } = await supabase
    .from('projects_models')
    .select(`
      client_selection,
      models (*)
    `)
    .eq('project_id', projectId);

  if (error || !projectModelsData) {
    console.error('Error fetching models for project:', error);
    return [];
  }

  const models = projectModelsData.flatMap(item => {
    const modelData = item.models;
    if (!modelData || Array.isArray(modelData) || typeof modelData !== 'object') {
      return [];
    }
    const model = modelData as unknown as Model;
    return [{
      ...model,
      client_selection: item.client_selection ?? model.client_selection ?? null,
    }];
  });

  const enrichedModels = await Promise.all(
    models.map(async (model) => {
      const imagePath = `${model.id}/Portada/cover.jpg`;
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrl(imagePath, 300);

      return {
        ...model,
        coverUrl: signedUrlError ? null : signedUrlData.signedUrl,
      };
    })
  );
  return enrichedModels;
}

export async function getModelForProject(projectId: string, modelId: string): Promise<Model | null> {
  noStore();
  const supabase = await createClient();

  const { data: projectModelData, error } = await supabase
    .from('projects_models')
    .select(`
      client_selection,
      models (*)
    `)
    .eq('project_id', projectId)
    .eq('model_id', modelId)
    .single();

  if (error || !projectModelData) {
    console.error('Error fetching model for project:', error);
    return null;
  }
  
  const modelData = projectModelData.models;
  if (!modelData || Array.isArray(modelData) || typeof modelData !== 'object') {
    return null;
  }

  const model = modelData as unknown as Model;

  const [coverUrlResult, portfolioUrlResult] = await Promise.all([
    supabase.storage.from(BUCKET_NAME).createSignedUrl(`${model.id}/Portada/cover.jpg`, 300),
    supabase.storage.from(BUCKET_NAME).createSignedUrl(`${model.id}/Portfolio/portfolio.jpg`, 300)
  ]);

  return {
    ...model,
    client_selection: projectModelData.client_selection ?? model.client_selection ?? null,
    coverUrl: coverUrlResult.error ? null : coverUrlResult.data.signedUrl,
    portfolioUrl: portfolioUrlResult.error ? null : portfolioUrlResult.data.signedUrl,
  };
}
""",
}

def apply_corrections():
    """
    Lee el diccionario de correcciones y aplica los cambios a los archivos correspondientes.
    """
    base_path = os.path.abspath(PROJECT_BASE_PATH)
    print(f"Buscando archivos en la ruta base: {base_path}\n")

    if not os.path.isdir(base_path):
        print(f"❌ ERROR: La ruta base '{base_path}' no es un directorio válido.")
        return

    for relative_path, new_content in corrections.items():
        # Normaliza la ruta para que funcione en cualquier sistema operativo (Windows, Linux, macOS)
        file_path_parts = relative_path.replace("\\", "/").split("/")
        absolute_path = os.path.join(base_path, *file_path_parts)
        
        try:
            if os.path.exists(absolute_path):
                # Elimina el primer caracter si es un salto de línea
                content_to_write = new_content.lstrip('\n')
                
                with open(absolute_path, 'w', encoding='utf-8') as f:
                    f.write(content_to_write)
                print(f"✅ Archivo actualizado: {relative_path}")
            else:
                print(f"⚠️  ADVERTENCIA: No se encontró el archivo: {relative_path}")
                print(f"   (Ruta completa buscada: {absolute_path})")

        except Exception as e:
            print(f"❌ ERROR al procesar el archivo {relative_path}: {e}")

if __name__ == "__main__":
    apply_corrections()
    print("\n🎉 Proceso de corrección completado.")
