import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getModelById } from '@/lib/api/models';
import ModelProfilePageClient from './page-client';

// ✅ Marca como async y accede a params correctamente
export default async function ModelProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // ⚠️ Mejora de seguridad: Usa getUser() en lugar de getSession()
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect('/login');
  }

  const model = await getModelById(params.id);

  return (
    <ModelProfilePageClient 
      initialModel={model} 
    />
  );
}