'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteProject } from '@/lib/actions/projects'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
  children: React.ReactNode;
}

export const DeleteProjectDialog = ({ projectId, projectName, children }: DeleteProjectDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteProject(projectId);

    if (result.success) {
      toast.success('Proyecto eliminado', { 
        description: `El proyecto "${projectName}" ha sido eliminado.` 
      });
      router.push('/dashboard/projects');
    } else {
      toast.error('Error al eliminar', { description: result.error });
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto 
            <span className="font-semibold"> {projectName} </span>
            y toda la selección de talentos asociada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} asChild>
            <Button variant="destructive">
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar proyecto'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
