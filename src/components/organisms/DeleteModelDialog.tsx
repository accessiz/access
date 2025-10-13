
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteModel } from '@/lib/actions/models'

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

interface DeleteModelDialogProps {
  modelId: string;
  modelAlias: string;
  children: React.ReactNode;
}

export const DeleteModelDialog = ({ modelId, modelAlias, children }: DeleteModelDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteModel(modelId);

    if (result.success) {
      toast.success('Modelo eliminado', { description: `${modelAlias} ha sido eliminado de la base de datos.` });

      // --- INICIO DE LA CORRECCIÓN ---
      // Simplemente navegamos a la lista. La server action ya se encargó de
      // invalidar la caché, por lo que la lista se mostrará actualizada.
      router.push('/dashboard/models');
      // La línea `router.refresh()` ha sido eliminada para prevenir el error.
      // --- FIN DE LA CORRECCIÓN ---

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
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el perfil de 
            <span className="font-semibold"> {modelAlias} </span>
            de la base de datos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} asChild>
            <Button variant="destructive">
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
