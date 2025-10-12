import os
import textwrap

# -----------------------------------------------------------------------------
# SCRIPT PARA CORREGIR LA INTERACCIÓN DEL COMBOBOX DENTRO DEL PANEL LATERAL
# -----------------------------------------------------------------------------
# Instrucciones:
# 1. Guarda este archivo como `actualizar_interaccion_combobox.py` en la raíz de tu proyecto.
# 2. Ejecuta el script con: python actualizar_interaccion_combobox.py
# -----------------------------------------------------------------------------

files_to_update = [
    {
        "path": "src/components/ui/sheet.tsx",
        "action": "modify",
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
                  <SheetPrimitive.Content
                    ref={ref}
                    className={cn(sheetVariants({ side }), "bg-background", className)}
                    onPointerDownOutside={(e) => {
                      const target = e.target as HTMLElement;
                      // Permite la interacción con otros elementos de Radix UI anidados (como Combobox)
                      if (target.closest('[data-radix-popper-content-wrapper]')) {
                        e.preventDefault();
                      }
                    }}
                    {...props}
                  >
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

def apply_interaction_fix():
    """
    Aplica el parche al componente Sheet para permitir la interacción
    con los componentes anidados como Popover/Combobox.
    """
    print("🚀 Corrigiendo la interacción del selector de países...")
    
    project_root = os.getcwd()
    
    for file_info in files_to_update:
        normalized_path = file_info["path"].replace("\\\\", "/").replace("\\", "/")
        file_path = os.path.join(project_root, normalized_path)
        
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(file_info["content"])
            print(f"✅ Archivo actualizado: {file_info['path']}")
        
        except Exception as e:
            print(f"❌ Error al procesar {file_info['path']}: {e}")
            
    print("\\n🎉 ¡Interacción corregida! El scroll y la selección deberían funcionar perfectamente ahora.")

if __name__ == "__main__":
    apply_interaction_fix()
