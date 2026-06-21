'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateModelProfile } from '@/lib/actions/models_portal';
import { toast } from 'sonner';

export function useProfileDetails(
  modelId: string,
  initialEmail?: string | null,
  initialPhone?: string | null,
  initialInstagram?: string | null,
  initialTiktok?: string | null
) {
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(initialEmail || '');
  const [phone, setPhone] = useState(initialPhone || '');
  const [instagram, setInstagram] = useState(initialInstagram || '');
  const [tiktok, setTiktok] = useState(initialTiktok || '');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const result = await updateModelProfile(modelId, email, phone, instagram, tiktok);
      if (result.success) {
        toast.success('perfil actualizado con éxito.');
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(result.error || 'error al actualizar el perfil.');
      }
    } catch (err) {
      toast.error('error de conexión al actualizar.');
    } finally {
      setIsPending(false);
    }
  };

  const handleCancel = () => {
    setEmail(initialEmail || '');
    setPhone(initialPhone || '');
    setInstagram(initialInstagram || '');
    setTiktok(initialTiktok || '');
    setIsEditing(false);
  };

  return {
    isEditing,
    setIsEditing,
    email,
    setEmail,
    phone,
    setPhone,
    instagram,
    setInstagram,
    tiktok,
    setTiktok,
    isPending,
    handleUpdateProfile,
    handleCancel,
  };
}
