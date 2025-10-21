'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteModel } from '../../lib/actions/models'

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
} from "../ui/alert-dialog"
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface DeleteModelDialogProps {
  modelId: string;
  modelAlias: string;
  children: React.ReactNode;
}

export const DeleteModelDialog = ({ modelId, modelAlias, children }: DeleteModelDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteModel(modelId);

    if (result.success) {
      toast.success('Modelo eliminado', { description: `${modelAlias} ha sido eliminado de la base de datos.` });

      // CORRECCIÓN: Simplificamos la navegación.
      // Un simple `router.push` es suficiente para redirigir al usuario.
      // La revalidación de datos ya la hace la server action, por lo que
      // `router.refresh()` no es necesario y puede contribuir a la race condition.
      router.push('/dashboard/models');

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
        {/* Confirmación extra: pedir al usuario escribir el alias para confirmar */}
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Para confirmar, escribe el alias del modelo exactamente:</p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={String(modelAlias)}
            aria-label="Confirmar alias para eliminar"
          />
          {confirmText && confirmText.trim() !== String(modelAlias).trim() && (
            <p className="text-xs text-destructive mt-1">El texto no coincide con el alias. Escribe exactamente: <span className="font-mono">{modelAlias}</span></p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting || String(confirmText).trim() !== String(modelAlias).trim()} asChild>
            <Button variant="destructive">
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
