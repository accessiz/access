import os
import textwrap

# -----------------------------------------------------------------------------
# SCRIPT PARA ACTUALIZAR EL FORMULARIO DE "AÑADIR TALENTO"
# -----------------------------------------------------------------------------
# Instrucciones:
# 1. Guarda este archivo como `actualizar_formulario.py` en la raíz de tu proyecto.
# 2. Ejecuta el script desde tu terminal con: python actualizar_formulario.py
# -----------------------------------------------------------------------------

# Define los archivos que se van a sobrescribir con su nuevo contenido.
files_to_update = [
    {
        "path": "src/components/organisms/AddTalentSheet.tsx",
        "content": textwrap.dedent("""
            "use client";

            import { useState } from 'react';
            import { useRouter } from 'next/navigation';
            import { Button } from "@/components/ui/button";
            import { Input } from "@/components/ui/input";
            import { Label } from "@/components/ui/label";
            import {
              Sheet,
              SheetContent,
              SheetDescription,
              SheetHeader,
              SheetTitle,
              SheetFooter,
              SheetClose,
            } from "@/components/ui/sheet";
            import {
              Select,
              SelectContent,
              SelectItem,
              SelectTrigger,
              SelectValue,
            } from "@/components/ui/select";
            import { createClient } from '../../lib/supabase/client';
            import { toast } from 'sonner';
            import { Model } from '@/lib/types';

            // Define el tipo para los datos del formulario, excluyendo campos autogenerados.
            type FormData = Omit<Model, 'id' | 'created_at' | 'profile_completion' | 'status'>;

            // Estado inicial vacío para el formulario.
            const initialState: FormData = {
                alias: '',
                full_name: '',
                national_id: '',
                gender: null,
                birth_date: '',
                country: null,
                height_cm: null,
                shoulders_cm: null,
                chest_cm: null,
                bust_cm: null,
                waist_cm: null,
                hips_cm: null,
                top_size: '',
                pants_size: '',
                shoe_size_eu: null,
                eye_color: '',
                hair_color: '',
                instagram: '',
                tiktok: '',
                email: '',
                phone_number: '',
            };

            export function AddTalentSheet({ children }: { children: React.ReactNode }) {
              const [isOpen, setIsOpen] = useState(false);
              const [loading, setLoading] = useState(false);
              const [formData, setFormData] = useState<FormData>(initialState);
              const supabase = createClient();
              const router = useRouter();

              // Maneja cambios en los inputs de texto y número.
              const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const { name, value } = e.target;
                const isNumeric = ['height_cm', 'shoulders_cm', 'chest_cm', 'bust_cm', 'waist_cm', 'hips_cm', 'shoe_size_eu'].includes(name);
                setFormData(prev => ({ ...prev, [name]: value === '' ? null : (isNumeric ? Number(value) : value) }));
              };

              // Maneja cambios en los campos de selección (Select).
              const handleSelectChange = (name: keyof FormData, value: string) => {
                setFormData(prev => ({ ...prev, [name]: value }));
              };

              // Envía el formulario a Supabase.
              const handleSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
                setLoading(true);

                // Limpia los datos, eliminando claves con valores nulos o vacíos antes de enviar.
                const cleanedData: Partial<FormData> = {};
                for (const key in formData) {
                  if (formData[key as keyof FormData] !== null && formData[key as keyof FormData] !== '') {
                    cleanedData[key as keyof FormData] = formData[key as keyof FormData];
                  }
                }

                const { error } = await supabase.from('models').insert([cleanedData]);

                setLoading(false);
                if (error) {
                  console.error('Error creating model:', error);
                  toast.error('Error al crear el perfil', {
                    description: error.message,
                  });
                } else {
                  toast.success('Talento añadido con éxito', {
                    description: `${formData.alias || formData.full_name} ha sido añadido a la base de datos.`,
                  });
                  setIsOpen(false);
                  setFormData(initialState); // Resetea el formulario
                  router.refresh(); // Refresca los datos en la página de talentos
                }
              };

              return (
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  {children}
                  <SheetContent className="flex flex-col p-0">
                    {/* Contenedor principal para alinear todo el contenido */}
                    <div className="w-full max-w-5xl mx-auto flex flex-col h-full">
                      <SheetHeader className="p-6 pb-4 shrink-0">
                        <SheetTitle>Añadir Nuevo Talento</SheetTitle>
                        <SheetDescription>
                          Rellena los datos para crear un nuevo perfil. Los campos marcados con * son obligatorios.
                        </SheetDescription>
                      </SheetHeader>
                      
                      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6">
                           <div className="space-y-6 py-6">
                              {/* --- Sección de Información Básica --- */}
                              <div className="space-y-4">
                                  <h3 className="text-lg font-medium">Información Básica</h3>
                                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 p-6 border rounded-lg">
                                    <div className="grid gap-2">
                                      <Label htmlFor="alias">Alias *</Label>
                                      <Input id="alias" name="alias" value={formData.alias || ''} onChange={handleChange} required />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="full_name">Nombre Completo *</Label>
                                      <Input id="full_name" name="full_name" value={formData.full_name || ''} onChange={handleChange} required />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="birth_date">Nacimiento</Label>
                                      <Input id="birth_date" name="birth_date" type="date" value={formData.birth_date || ''} onChange={handleChange} />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="country">País</Label>
                                      <Select onValueChange={(value) => handleSelectChange('country', value)} value={formData.country || undefined}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Guatemala">Guatemala</SelectItem>
                                          <SelectItem value="El Salvador">El Salvador</SelectItem>
                                          <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                     <div className="grid gap-2">
                                        <Label htmlFor="national_id">Documento ID</Label>
                                        <Input id="national_id" name="national_id" value={formData.national_id || ''} onChange={handleChange} />
                                    </div>
                                     <div className="grid gap-2">
                                      <Label htmlFor="gender">Género</Label>
                                      <Select onValueChange={(value) => handleSelectChange('gender', value)} value={formData.gender || undefined}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Female">Femenino</SelectItem>
                                          <SelectItem value="Male">Masculino</SelectItem>
                                          <SelectItem value="Other">Otro</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                              </div>

                              {/* --- Sección de Medidas y Tallas --- */}
                              <div className="space-y-4">
                                  <h3 className="text-lg font-medium">Medidas y Tallas</h3>
                                  <div className="grid md:grid-cols-3 gap-x-6 gap-y-4 p-6 border rounded-lg">
                                    <div className="grid gap-2"><Label htmlFor="height_cm">Estatura (cm)</Label><Input id="height_cm" name="height_cm" type="number" placeholder="180" value={formData.height_cm || ''} onChange={handleChange} /></div>
                                    <div className="grid gap-2"><Label htmlFor="shoulders_cm">Hombros (cm)</Label><Input id="shoulders_cm" name="shoulders_cm" type="number" placeholder="45" value={formData.shoulders_cm || ''} onChange={handleChange} /></div>
                                    <div className="grid gap-2"><Label htmlFor="chest_cm">Pecho (cm)</Label><Input id="chest_cm" name="chest_cm" type="number" placeholder="95" value={formData.chest_cm || ''} onChange={handleChange} /></div>
                                    <div className="grid gap-2"><Label htmlFor="bust_cm">Busto (cm)</Label><Input id="bust_cm" name="bust_cm" type="number" placeholder="90" value={formData.bust_cm || ''} onChange={handleChange} /></div>
                                    <div className="grid gap-2"><Label htmlFor="waist_cm">Cintura (cm)</Label><Input id="waist_cm" name="waist_cm" type="number" placeholder="60" value={formData.waist_cm || ''} onChange={handleChange} /></div>
                                    <div className="grid gap-2"><Label htmlFor="hips_cm">Cadera (cm)</Label><Input id="hips_cm" name="hips_cm" type="number" placeholder="90" value={formData.hips_cm || ''} onChange={handleChange} /></div>
                                    <div className="grid gap-2"><Label htmlFor="top_size">Talla Superior</Label><Input id="top_size" name="top_size" placeholder="S, M..." value={formData.top_size || ''} onChange={handleChange} /></div>
                                    <div className="grid gap-2"><Label htmlFor="pants_size">Pantalón</Label><Input id="pants_size" name="pants_size" placeholder="28, 30..." value={formData.pants_size || ''} onChange={handleChange} /></div>
                                    <div className="grid gap-2"><Label htmlFor="shoe_size_eu">Zapato (EU)</Label><Input id="shoe_size_eu" name="shoe_size_eu" type="number" placeholder="39" value={formData.shoe_size_eu || ''} onChange={handleChange} /></div>
                                  </div>
                              </div>

                              {/* --- Sección de Apariencia y Contacto --- */}
                              <div className="space-y-4">
                                  <h3 className="text-lg font-medium">Apariencia y Contacto</h3>
                                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 p-6 border rounded-lg">
                                     <div className="grid gap-2"><Label htmlFor="hair_color">Color de Cabello</Label><Input id="hair_color" name="hair_color" value={formData.hair_color || ''} onChange={handleChange} /></div>
                                     <div className="grid gap-2"><Label htmlFor="eye_color">Color de Ojos</Label><Input id="eye_color" name="eye_color" value={formData.eye_color || ''} onChange={handleChange} /></div>
                                     <div className="grid gap-2"><Label htmlFor="instagram">Instagram</Label><Input id="instagram" name="instagram" placeholder="usuario" value={formData.instagram || ''} onChange={handleChange} /></div>
                                     <div className="grid gap-2"><Label htmlFor="tiktok">TikTok</Label><Input id="tiktok" name="tiktok" placeholder="usuario" value={formData.tiktok || ''} onChange={handleChange} /></div>
                                     <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="correo@ejemplo.com" value={formData.email || ''} onChange={handleChange} /></div>
                                     <div className="grid gap-2"><Label htmlFor="phone_number">Teléfono</Label><Input id="phone_number" name="phone_number" placeholder="+502 1234 5678" value={formData.phone_number || ''} onChange={handleChange} /></div>
                                  </div>
                              </div>
                           </div>
                        </div>
                        <SheetFooter className="p-6 border-t mt-auto shrink-0">
                          <SheetClose asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                          </SheetClose>
                          <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Perfil'}
                          </Button>
                        </SheetFooter>
                      </form>
                    </div>
                  </SheetContent>
                </Sheet>
              );
            }
        """)
    },
    {
        "path": "src/components/ui/sheet.tsx",
        "content": textwrap.dedent("""
            "use client"

            import * as React from "react"
            import * as SheetPrimitive from "@radix-ui/react-dialog"
            import { cva, type VariantProps } from "class-variance-authority"
            import { X } from "lucide-react"

            import { cn } from "@/lib/utils"

            const Sheet = SheetPrimitive.Root

            const SheetTrigger = SheetPrimitive.Trigger

            const SheetClose = SheetPrimitive.Close

            const SheetPortal = SheetPrimitive.Portal

            const SheetOverlay = React.forwardRef<
              React.ElementRef<typeof SheetPrimitive.Overlay>,
              React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
            >(({ className, ...props }, ref) => (
              <SheetPrimitive.Overlay
                className={cn(
                  "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                  className
                )}
                {...props}
                ref={ref}
              />
            ))
            SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

            const sheetVariants = cva(
              "fixed z-50 gap-4 bg-background shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
              {
                variants: {
                  side: {
                    top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
                    bottom:
                      "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                    left: "inset-y-0 left-0 h-full w-11/12 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:w-2/3 md:w-1/2 lg:max-w-2xl",
                    right:
                      "inset-y-0 right-0 h-full w-11/12 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:w-5/6 md:w-4/5 lg:w-3/4",
                  },
                },
                defaultVariants: {
                  side: "right",
                },
              }
            )

            interface SheetContentProps
              extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
                VariantProps<typeof sheetVariants> {}

            const SheetContent = React.forwardRef<
              React.ElementRef<typeof SheetPrimitive.Content>,
              SheetContentProps
            >(({ side = "right", className, children, ...props }, ref) => (
              <SheetPortal>
                <SheetOverlay />
                <SheetPrimitive.Content
                  ref={ref}
                  className={cn(sheetVariants({ side }), className)}
                  {...props}
                >
                  {children}
                  <SheetPrimitive.Close className="absolute right-6 top-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </SheetPrimitive.Close>
                </SheetPrimitive.Content>
              </SheetPortal>
            ))
            SheetContent.displayName = SheetPrimitive.Content.displayName

            const SheetHeader = ({
              className,
              ...props
            }: React.HTMLAttributes<HTMLDivElement>) => (
              <div
                className={cn(
                  "flex flex-col space-y-2 text-center sm:text-left",
                  className
                )}
                {...props}
              />
            )
            SheetHeader.displayName = "SheetHeader"

            const SheetFooter = ({
              className,
              ...props
            }: React.HTMLAttributes<HTMLDivElement>) => (
              <div
                className={cn(
                  "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
                  className
                )}
                {...props}
              />
            )
            SheetFooter.displayName = "SheetFooter"

            const SheetTitle = React.forwardRef<
              React.ElementRef<typeof SheetPrimitive.Title>,
              React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
            >(({ className, ...props }, ref) => (
              <SheetPrimitive.Title
                ref={ref}
                className={cn("text-lg font-semibold text-foreground", className)}
                {...props}
              />
            ))
            SheetTitle.displayName = SheetPrimitive.Title.displayName

            const SheetDescription = React.forwardRef<
              React.ElementRef<typeof SheetPrimitive.Description>,
              React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
            >(({ className, ...props }, ref) => (
              <SheetPrimitive.Description
                ref={ref}
                className={cn("text-sm text-muted-foreground", className)}
                {...props}
              />
            ))
            SheetDescription.displayName = SheetPrimitive.Description.displayName

            export {
              Sheet,
              SheetPortal,
              SheetOverlay,
              SheetTrigger,
              SheetClose,
              SheetContent,
              SheetHeader,
              SheetFooter,
              SheetTitle,
              SheetDescription,
            }
        """)
    }
]

def apply_form_update():
    """
    Aplica las actualizaciones de diseño al formulario de "Añadir Talento".
    """
    print("🚀 Aplicando actualizaciones al formulario y al panel lateral...")
    
    project_root = os.getcwd()
    
    for file_info in files_to_update:
        # Reemplaza las barras invertidas por barras normales para compatibilidad entre OS
        normalized_path = file_info["path"].replace("\\\\", "/").replace("\\", "/")
        file_path = os.path.join(project_root, normalized_path)
        
        try:
            # Asegúrate de que el directorio exista antes de escribir el archivo
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            # CORRECCIÓN: Se eliminó el parámetro `newline` que causaba errores en Windows.
            # Python manejará las terminaciones de línea universalmente por defecto.
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(file_info["content"])
            print(f"✅ Archivo actualizado con éxito: {file_info['path']}")
        
        except FileNotFoundError:
            print(f"⚠️ Advertencia: No se encontró el archivo {file_info['path']}. Se omitió.")
        except Exception as e:
            print(f"❌ Error al procesar {file_info['path']}: {e}")
            
    print("\\n🎉 ¡Actualización completada! Revisa los cambios y reinicia tu servidor de desarrollo.")

if __name__ == "__main__":
    apply_form_update()

