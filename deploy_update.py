import os
import textwrap

# -----------------------------------------------------------------------------
# SCRIPT DE IMPLEMENTACIÓN AUTOMÁTICA PARA NYXA (v4)
# -----------------------------------------------------------------------------
# Este script crea y/o actualiza los archivos necesarios para implementar
# la funcionalidad de "Gestión de Comp Card".
# v4: Corrige un error de sintaxis JSX en page-client.tsx y mejora la
#     lógica de subida de archivos para usar modelId y sobreescribir portadas.
# -----------------------------------------------------------------------------

# Estructura de datos con la información de los archivos a gestionar.
files_to_manage = [
    {
        "path": "src/components/organisms/CompCardManager.tsx",
        "action": "create", # La acción sigue siendo create/update
        "content": textwrap.dedent("""
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
        """)
    },
    {
        "path": "src/lib/actions/storage.ts",
        "action": "update", # Ahora es update porque ya lo creamos
        "content": textwrap.dedent("""
            'use server'

            import { createClient } from '@/lib/supabase/server'
            import { revalidatePath } from 'next/cache'
            import { z } from 'zod'

            const modelInfoSchema = z.object({
              modelId: z.string().uuid(),
              gender: z.enum(['Male', 'Female', 'Other']),
              photoType: z.enum(['Portada', 'Contraportada', 'Portafolio']),
              slotIndex: z.number().optional(),
            });

            export async function uploadModelImage(formData: FormData) {
              const supabase = createClient();
              
              const file = formData.get('file') as File;
              const modelInfoPayload = formData.get('modelInfo') as string;
              
              if (!file || !modelInfoPayload) {
                return { success: false, error: 'Faltan datos para la subida.' };
              }

              const modelInfoParsed = modelInfoSchema.safeParse(JSON.parse(modelInfoPayload));
              if (!modelInfoParsed.success) {
                  return { success: false, error: 'La información del modelo no es válida.' };
              }
              const modelInfo = modelInfoParsed.data;

              const genderFolder = modelInfo.gender === 'Male' ? 'Hombres' : 'Mujeres';
              const filePath = `${genderFolder}/${modelInfo.modelId}/${modelInfo.photoType}/`;

              const fileExtension = file.name.split('.').pop();
              let fileName;
              if (modelInfo.photoType === 'Portada') {
                // Usamos un nombre fijo para la portada para poder sobreescribirla
                fileName = `cover.${fileExtension}`;
              } else {
                // Para contraportada y portafolio, usamos un nombre único
                fileName = `photo_${modelInfo.slotIndex ?? ''}_${Date.now()}.${fileExtension}`;
              }
              
              const fullPath = filePath + fileName;

              const { error } = await supabase.storage
                .from('Book_Completo_iZ_Management')
                .upload(fullPath, file, {
                    // La opción 'upsert' permite sobreescribir el archivo si ya existe.
                    // Es ideal para la portada.
                    upsert: modelInfo.photoType === 'Portada',
                });

              if (error) {
                console.error('Supabase upload error:', error);
                return { success: false, error: 'No se pudo subir el archivo a Supabase.' };
              }
              
              const { data: { publicUrl } } = supabase.storage
                .from('Book_Completo_iZ_Management')
                .getPublicUrl(fullPath);

              // Revalidamos la caché de las páginas relevantes para que se reflejen los cambios
              revalidatePath('/dashboard/models');
              revalidatePath(`/dashboard/models/${modelInfo.modelId}`);
              
              return { success: true, url: publicUrl };
            }
        """)
    },
    {
        "path": "src/app/dashboard/models/[id]/page-client.tsx",
        "action": "update",
        "content": textwrap.dedent("""
            'use client'

            import { useState } from 'react';
            import { useRouter } from 'next/navigation';
            import Link from 'next/link';
            import { toast } from 'sonner';
            import { Model } from '../../../../lib/types';
            import { ModelFormData } from '../../../../lib/schemas';
            import { updateModel } from '../../../../lib/actions/models';
            import { type SubmitHandler } from 'react-hook-form';

            import { Button } from '../../../../components/ui/button';
            import { Label } from '../../../../components/ui/label';
            import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
            import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
            import { ChevronLeft, FilePenLine } from 'lucide-react';
            import { DeleteModelDialog } from '../../../../components/organisms/DeleteModelDialog';
            import { ModelForm } from '../../../../components/organisms/ModelForm';
            import { CompCardManager } from '../../../../components/organisms/CompCardManager';

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

            const StaticInfoDisplay = ({ model }: { model: Model }) => {
                return (
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información Básica</CardTitle>
                                <CardDescription>Datos personales y de identificación del talento.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                                <DataPoint label="Nombre Completo" value={model.full_name} />
                                <DataPoint label="Fecha de Nacimiento" value={model.birth_date} />
                                <DataPoint label="País" value={model.country} />
                                <DataPoint label="Documento ID" value={model.national_id} />
                                <DataPoint label="Género" value={model.gender} />
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Medidas y Tallas</CardTitle>
                                <CardDescription>Medidas corporales y tallas de vestuario.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                                <DataPoint label="Estatura" value={model.height_cm ? `${model.height_cm} cm` : null} />
                                <DataPoint label="Hombros" value={model.shoulders_cm ? `${model.shoulders_cm} cm` : null} />
                                <DataPoint label="Pecho" value={model.chest_cm ? `${model.chest_cm} cm` : null} />
                                <DataPoint label="Busto" value={model.bust_cm ? `${model.bust_cm} cm` : null} />
                                <DataPoint label="Cintura" value={model.waist_cm ? `${model.waist_cm} cm` : null} />
                                <DataPoint label="Cadera" value={model.hips_cm ? `${model.hips_cm} cm` : null} />
                                <DataPoint label="Talla Superior" value={model.top_size} />
                                <DataPoint label="Pantalón" value={model.pants_size} />
                                <DataPoint label="Zapato (EU)" value={model.shoe_size_eu} />
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Contacto y Redes Sociales</CardTitle>
                                <CardDescription>Canales de comunicación y perfiles en línea.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                                <DataPoint label="Email" value={model.email} />
                                <DataPoint label="Teléfono" value={model.phone_number} />
                                <DataPoint label="Instagram">
                                    {model.instagram ? <a href={`https://instagram.com/${model.instagram}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">@{model.instagram}</a> : '—'}
                                </DataPoint>
                                <DataPoint label="TikTok">
                                    {model.tiktok ? <a href={`https://tiktok.com/@${model.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">@{model.tiktok}</a> : '—'}
                                </DataPoint>
                            </CardContent>
                        </Card>
                    </div>
                );
            };

            const DangerZone = ({ modelId, modelAlias }: { modelId: string, modelAlias: string }) => (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        <CardDescription>
                            La acción en esta zona es permanente y no se puede deshacer.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/5 p-4">
                            <div>
                                <p className="font-semibold text-foreground">Eliminar este talento</p>
                                <p className="text-sm text-muted-foreground">
                                    Una vez eliminado, todos los datos asociados se perderán para siempre.
                                </p>
                            </div>
                            <DeleteModelDialog modelId={modelId} modelAlias={modelAlias}>
                                <Button variant="destructive">Eliminar</Button>
                            </DeleteModelDialog>
                        </div>
                    </CardContent>
                </Card>
            );

            export default function ModelProfilePageClient({ initialModel, publicUrl }: { initialModel: Model | null, publicUrl: string }) {
              const [isEditing, setIsEditing] = useState(false);
              const [isSubmitting, setIsSubmitting] = useState(false);
              const [model, setModel] = useState(initialModel);

              if (!model) { return <div className="text-center py-20"><p>No se encontró el modelo.</p></div>; }

              const handleSubmit: SubmitHandler<ModelFormData> = async (data) => {
                setIsSubmitting(true);
                const result = await updateModel(model.id, data);
                
                if (result.success) {
                  toast.success('Perfil actualizado!', {
                    description: `Los cambios en ${data.alias} han sido guardados.`
                  });
                  
                  const dataForState = {
                    ...data,
                    pants_size: data.pants_size !== null ? String(data.pants_size) : null,
                  };

                  setModel({ ...model, ...dataForState });
                  setIsEditing(false);
                } else {
                  toast.error('Error al actualizar', { description: result.error });
                }
                setIsSubmitting(false);
              };
              
              const fallbackText = model.alias?.substring(0, 2) || 'IZ';
              const imageUrl = `${publicUrl}/Book_Completo_iZ_Management/${model.gender === 'Male' ? 'Hombres' : 'Mujeres'}/${model.id}/Portada/cover.jpg`;

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
                        <Avatar className="h-16 w-16 hidden sm:flex"><AvatarImage src={imageUrl} alt={model.alias || 'Avatar'} /><AvatarFallback className="text-xl">{fallbackText}</AvatarFallback></Avatar>
                        <div>
                          <h1 className="text-3xl font-bold tracking-tight">{model.alias}</h1>
                          <p className="text-muted-foreground">{model.full_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>Cancelar</Button>
                          <Button form="model-edit-form" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
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
                          <CompCardManager model={model} />
                          
                          <Card>
                            <CardHeader>
                              <CardTitle>Portafolio Completo</CardTitle>
                              <CardDescription>Gestiona las imágenes principales del portafolio.</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-center text-center h-48 rounded-lg border-2 border-dashed">
                                <p className="text-muted-foreground">Próximamente...</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        <DangerZone modelId={model.id} modelAlias={model.alias || 'este modelo'} />
                      </>
                    )}
                  </main>
                </div>
              );
            }
        """)
    },
]

def apply_changes():
    """
    Crea, edita o mueve archivos según la configuración definida en `files_to_manage`.
    """
    print("🚀 Iniciando la implementación de cambios en el proyecto...")
    
    project_root = os.getcwd()
    
    for file_info in files_to_manage:
        file_path = os.path.join(project_root, file_info["path"])
        action = file_info["action"]
        content = file_info["content"]
        
        try:
            dir_name = os.path.dirname(file_path)
            if not os.path.exists(dir_name):
                os.makedirs(dir_name)
                print(f"📁 Directorio creado: {os.path.relpath(dir_name, project_root)}")

            # CORRECCIÓN DEFINITIVA v3: Se elimina el parámetro 'newline'
            # y se deja que el sistema operativo maneje los saltos de línea.
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            action_verb = "Creado" if action == "create" else "Actualizado"
            print(f"✅ {action_verb}: {os.path.relpath(file_path, project_root)}")
            
        except Exception as e:
            print(f"❌ Error al procesar {file_info['path']}: {e}")
            
    print("\\n🎉 ¡Implementación completada con éxito!")
    print("Por favor, reinicia tu servidor de desarrollo para ver los cambios.")

if __name__ == "__main__":
    apply_changes()

