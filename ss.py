import os
import textwrap

# -----------------------------------------------------------------------------
# SCRIPT PARA REFINAR EL TEMA OSCURO DEL DASHBOARD
# -----------------------------------------------------------------------------
# Instrucciones:
# 1. Guarda este archivo como `actualizar_tema_color.py` en la raíz de tu proyecto.
# 2. Ejecuta el script desde tu terminal con: python actualizar_tema_color.py
# -----------------------------------------------------------------------------

files_to_update = [
    {
        "path": "src/app/globals.css",
        "content": textwrap.dedent("""
            @tailwind base;
            @tailwind components;
            @tailwind utilities;

            @layer base {
              :root {
                /* MODO CLARO (SIN CAMBIOS) */
                --background: 249 249 249;
                --foreground: 20 20 20;
                --nav-background: 255 255 255;
                --nav-foreground: 20 20 20;
                --card: 255 255 255;
                --card-foreground: 20 20 20;
                --popover: 255 255 255;
                --popover-foreground: 20 20 20;
                --primary: 135 24 157;
                --primary-foreground: 250 250 250;
                --secondary: 242 242 242;
                --secondary-foreground: 28 26 29;
                --muted: 242 242 242;
                --muted-foreground: 120 120 120;
                --accent: 242 242 242;
                --accent-foreground: 28 26 29;
                --destructive: 220 38 38;
                --destructive-foreground: 250 250 250;
                --border: 230 230 230;
                --input: 230 230 230;
                --ring: 135 24 157;
                --radius: 0.5rem;
              }

              .dark {
                /* ======================================================= */
                /* ==   NUEVO TEMA OSCURO REFINADO (ESTILO VERCEL)      == */
                /* ======================================================= */
                --background: 16 16 16;           /* Fondo principal (gris muy oscuro) */
                --foreground: 235 235 235;         /* Texto principal (casi blanco) */

                /* Paneles que "flotan" sobre el fondo */
                --nav-background: 24 24 24;       /* Sidebar, Header */
                --nav-foreground: 235 235 235;
                
                --card: 24 24 24;                 /* Tarjetas, Popovers */
                --card-foreground: 235 235 235;

                --popover: 24 24 24;
                --popover-foreground: 235 235 235;
                
                --primary: 135 24 157;            /* Color primario (sin cambios) */
                --primary-foreground: 250 250 250;
                
                /* Colores para estados y elementos secundarios */
                --secondary: 50 50 50;            /* Hover, elementos activos */
                --secondary-foreground: 250 250 250;
                
                --muted: 50 50 50;
                --muted-foreground: 160 160 160;   /* Texto secundario/apagado */
                
                --accent: 50 50 50;
                --accent-foreground: 250 250 250;
                
                --destructive: 153 27 27;
                --destructive-foreground: 235 235 235;
                
                /* Bordes e inputs sutiles */
                --border: 40 40 40;
                --input: 40 40 40;
                --ring: 135 24 157;               /* Anillo de foco (sin cambios) */
              }
            }
            
            @layer base {
              html {
                font-size: 88%; 
              }
              * {
                @apply border-border;
              }
              body {
                @apply bg-background text-foreground;
                font-feature-settings: "rlig" 1, "calt" 1;
                font-size: 1rem;
              }
            }

            /* Estilos de Scrollbar (sin cambios) */
            * {
              scrollbar-width: thin;
              scrollbar-color: hsl(var(--muted-foreground) / 0.5) transparent;
            }
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: transparent;
            }
            ::-webkit-scrollbar-thumb {
              background-color: hsl(var(--muted-foreground) / 0.5);
              border-radius: 10px;
              border: 2px solid transparent;
              background-clip: content-box;
            }
            ::-webkit-scrollbar-thumb:hover {
              background-color: hsl(var(--primary));
            }
        """)
    },
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

            type FormData = Omit<Model, 'id' | 'created_at' | 'profile_completion' | 'status'>;

            const initialState: FormData = {
                alias: '', full_name: '', national_id: '', gender: null, birth_date: '',
                country: null, height_cm: null, shoulders_cm: null, chest_cm: null,
                bust_cm: null, waist_cm: null, hips_cm: null, top_size: '',
                pants_size: '', shoe_size_eu: null, eye_color: '', hair_color: '',
                instagram: '', tiktok: '', email: '', phone_number: '',
            };

            export function AddTalentSheet({ children }: { children: React.ReactNode }) {
              const [isOpen, setIsOpen] = useState(false);
              const [loading, setLoading] = useState(false);
              const [formData, setFormData] = useState<FormData>(initialState);
              const supabase = createClient();
              const router = useRouter();

              const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const { name, value } = e.target;
                const isNumeric = ['height_cm', 'shoulders_cm', 'chest_cm', 'bust_cm', 'waist_cm', 'hips_cm', 'shoe_size_eu'].includes(name);
                setFormData(prev => ({ ...prev, [name]: value === '' ? null : (isNumeric ? Number(value) : value) }));
              };

              const handleSelectChange = (name: keyof FormData, value: string) => {
                setFormData(prev => ({ ...prev, [name]: value }));
              };

              const handleSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
                setLoading(true);

                const cleanedData: Partial<FormData> = {};
                for (const key in formData) {
                  if (formData[key as keyof FormData] !== null && formData[key as keyof FormData] !== '') {
                    cleanedData[key as keyof FormData] = formData[key as keyof FormData];
                  }
                }

                const { error } = await supabase.from('models').insert([cleanedData]);

                setLoading(false);
                if (error) {
                  toast.error('Error al crear el perfil', { description: error.message });
                } else {
                  toast.success('Talento añadido con éxito', {
                    description: `${formData.alias || formData.full_name} ha sido añadido.`,
                  });
                  setIsOpen(false);
                  setFormData(initialState);
                  router.refresh();
                }
              };

              return (
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  {children}
                  <SheetContent className="flex flex-col p-0">
                    <div className="w-full max-w-5xl mx-auto flex flex-col h-full">
                      <SheetHeader className="px-8 pt-16 pb-4 shrink-0">
                        <SheetTitle>Añadir Nuevo Talento</SheetTitle>
                        <SheetDescription>
                          Rellena los datos para crear un nuevo perfil. Los campos marcados con * son obligatorios.
                        </SheetDescription>
                      </SheetHeader>
                      
                      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-8">
                           <div className="space-y-8 py-6">
                              {/* --- Sección de Información Básica --- */}
                              <div className="space-y-4">
                                  <h3 className="text-lg font-medium">Información Básica</h3>
                                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 p-6 bg-card border rounded-lg">
                                    <div className="grid gap-2"><Label htmlFor="alias">Alias *</Label><Input id="alias" name="alias" value={formData.alias || ''} onChange={handleChange} required /></div>
                                    <div className="grid gap-2"><Label htmlFor="full_name">Nombre Completo *</Label><Input id="full_name" name="full_name" value={formData.full_name || ''} onChange={handleChange} required /></div>
                                    <div className="grid gap-2"><Label htmlFor="birth_date">Nacimiento</Label><Input id="birth_date" name="birth_date" type="date" value={formData.birth_date || ''} onChange={handleChange} /></div>
                                    <div className="grid gap-2"><Label htmlFor="country">País</Label><Select onValueChange={(value) => handleSelectChange('country', value)} value={formData.country || undefined}><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Guatemala">Guatemala</SelectItem><SelectItem value="El Salvador">El Salvador</SelectItem><SelectItem value="Costa Rica">Costa Rica</SelectItem></SelectContent></Select></div>
                                    <div className="grid gap-2"><Label htmlFor="national_id">Documento ID</Label><Input id="national_id" name="national_id" value={formData.national_id || ''} onChange={handleChange} /></div>
                                    <div className="grid gap-2"><Label htmlFor="gender">Género</Label><Select onValueChange={(value) => handleSelectChange('gender', value)} value={formData.gender || undefined}><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Female">Femenino</SelectItem><SelectItem value="Male">Masculino</SelectItem><SelectItem value="Other">Otro</SelectItem></SelectContent></Select></div>
                                  </div>
                              </div>

                              {/* --- Sección de Medidas y Tallas --- */}
                              <div className="space-y-4">
                                  <h3 className="text-lg font-medium">Medidas y Tallas</h3>
                                  <div className="grid md:grid-cols-3 gap-x-6 gap-y-4 p-6 bg-card border rounded-lg">
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
                                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 p-6 bg-card border rounded-lg">
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
                        <SheetFooter className="px-8 pt-6 pb-16 border-t mt-auto shrink-0">
                          <SheetClose asChild><Button type="button" variant="outline">Cancelar</Button></SheetClose>
                          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Perfil'}</Button>
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
        # Aplicamos el nuevo color de fondo al panel lateral
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
                className={cn("fixed inset-0 z-50 bg-background/80 backdrop-blur-sm", className)}
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
                    bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                    left: "inset-y-0 left-0 h-full w-11/12 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:w-2/3 md:w-1/2 lg:max-w-2xl",
                    right: "inset-y-0 right-0 h-full w-11/12 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:w-5/6 md:w-4/5 lg:w-3/4",
                  },
                },
                defaultVariants: { side: "right" },
              }
            )

            interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>, VariantProps<typeof sheetVariants> {}

            const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
              ({ side = "right", className, children, ...props }, ref) => (
                <SheetPortal>
                  <SheetOverlay />
                  <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), "bg-background", className)} {...props}>
                    {children}
                    <SheetPrimitive.Close className="absolute right-8 top-16 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </SheetPrimitive.Close>
                  </SheetPrimitive.Content>
                </SheetPortal>
              )
            )
            SheetContent.displayName = SheetPrimitive.Content.displayName

            const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (<div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />)
            SheetHeader.displayName = "SheetHeader"

            const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (<div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />)
            SheetFooter.displayName = "SheetFooter"

            const SheetTitle = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Title>, React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>>(({ className, ...props }, ref) => (<SheetPrimitive.Title ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />))
            SheetTitle.displayName = SheetPrimitive.Title.displayName

            const SheetDescription = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Description>, React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>>(({ className, ...props }, ref) => (<SheetPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />))
            SheetDescription.displayName = SheetPrimitive.Description.displayName

            export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription }
        """)
    }
]

def apply_theme_update():
    print("🚀 Aplicando nuevo tema de color al dashboard...")
    project_root = os.getcwd()
    
    for file_info in files_to_update:
        normalized_path = file_info["path"].replace("\\\\", "/").replace("\\", "/")
        file_path = os.path.join(project_root, normalized_path)
        
        try:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(file_info["content"])
            print(f"✅ Archivo actualizado: {file_info['path']}")
        
        except Exception as e:
            print(f"❌ Error al procesar {file_info['path']}: {e}")
            
    print("\\n🎉 ¡Tema de color actualizado con éxito! Por favor, reinicia tu servidor de desarrollo.")

if __name__ == "__main__":
    apply_theme_update()
