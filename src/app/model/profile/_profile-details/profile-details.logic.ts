'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateModelSocials } from '@/lib/actions/models_portal';
import { toast } from 'sonner';

export function useProfileDetails(modelId: string, initialInstagram?: string | null, initialTiktok?: string | null) {
  const [isEditing, setIsEditing] = useState(false);
  const [instagram, setInstagram] = useState(initialInstagram || '');
  const [tiktok, setTiktok] = useState(initialTiktok || '');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleUpdateSocials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const result = await updateModelSocials(modelId, instagram, tiktok);
      if (result.success) {
        toast.success('redes sociales actualizadas con éxito.');
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(result.error || 'error al actualizar redes sociales.');
      }
    } catch (err) {
      toast.error('error de conexión al actualizar.');
    } finally {
      setIsPending(false);
    }
  };

  const handleCancel = () => {
    setInstagram(initialInstagram || '');
    setTiktok(initialTiktok || '');
    setIsEditing(false);
  };

  return {
    isEditing,
    setIsEditing,
    instagram,
    setInstagram,
    tiktok,
    setTiktok,
    isPending,
    handleUpdateSocials,
    handleCancel,
  };
}
