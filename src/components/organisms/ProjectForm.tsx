'use client'

import { useFormState, useFormStatus } from 'react-dom';
import { createProject } from '@/lib/actions/projects';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Componente para el botón de envío que muestra un estado de carga.
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creando...' : 'Crear Proyecto'}
    </Button>
  );
}

export function ProjectForm() {
  const initialState = { error: null, success: false };
  // `useFormState` es un hook de React para manejar estados de formularios que usan Server Actions.
  const [state, dispatch] = useFormState(createProject, initialState);

  return (
    <form action={dispatch}>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Proyecto</CardTitle>
          <CardDescription>
            Rellena la información básica para tu nuevo casting. Podrás añadir modelos más adelante.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project_name">Nombre del Proyecto *</Label>
            <Input 
              id="project_name" 
              name="project_name" 
              placeholder="Ej: Campaña Verano 2025" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_name">Nombre del Cliente</Label>
            <Input 
              id="client_name" 
              name="client_name" 
              placeholder="Ej: Tiendas El Sol" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder="Notas internas sobre el proyecto, perfil buscado, etc."
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="password">Contraseña (Opcional)</Label>
            <Input 
              id="password" 
              name="password" 
              type="password"
              placeholder="Para proteger el enlace del cliente" 
            />
             <p className="text-xs text-muted-foreground">
              Si dejas esto en blanco, el enlace será público.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-between border-t pt-6">
           <Button variant="outline" asChild>
            <Link href="/dashboard/projects">
               Cancelar
            </Link>
          </Button>
          <SubmitButton />
        </CardFooter>
      </Card>
       {state?.error && <p className="text-sm text-destructive mt-4">{state.error}</p>}
    </form>
  );
}
