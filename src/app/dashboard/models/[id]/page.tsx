
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getModelById } from '@/lib/api/models';
import ModelProfilePageClient from './page-client';

export default async function ModelProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { redirect('/login'); }
  const model = await getModelById(params.id);
  const { data: publicUrlData } = supabase.storage.from('models').getPublicUrl('');
  return (
    <ModelProfilePageClient 
      initialModel={model} 
      publicUrl={publicUrlData.publicUrl} 
    />
  );
}
