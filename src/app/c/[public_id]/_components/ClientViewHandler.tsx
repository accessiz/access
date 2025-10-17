'use client';

import { useEffect } from 'react';
import { Project, Model } from '@/lib/types';
import { updateProjectStatus } from '@/lib/actions/projects'; // La Server Action que muta los datos

// Los componentes que este manejador decidirá renderizar
import PasswordProtect from './PasswordProtect';
import ClientSlider from './ClientSlider';

interface HandlerProps {
  project: Project;
  initialModels: Model[];
  hasAccessCookie: boolean;
}

export default function ClientViewHandler({ project, initialModels, hasAccessCookie }: HandlerProps) {
  
  // Este hook se ejecuta UNA SOLA VEZ en el cliente después de que la página carga.
  // Es el lugar perfecto para efectos secundarios como este.
  useEffect(() => {
    // Si el proyecto fue recién enviado, lo actualizamos a "En Revisión".
    if (project.status === 'sent') {
      // No necesitamos esperar la respuesta. Es una acción de "disparar y olvidar".
      updateProjectStatus(project.id, 'in-review');
    }
  }, [project.id, project.status]); // Se ejecuta si estas propiedades cambian

  // Ahora, aplicamos la lógica de renderizado que antes estaba en el Server Component
  if (project.password && !hasAccessCookie) {
    // Si el proyecto tiene contraseña y el cliente no tiene la cookie, mostramos el formulario.
    return <PasswordProtect projectId={project.id} projectName={project.project_name || 'este proyecto'} />;
  }

  // Si no hay contraseña o el cliente ya tiene la cookie, mostramos el slider.
  return <ClientSlider project={project} initialModels={initialModels} />;
}