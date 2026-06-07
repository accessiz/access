import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AccessTable } from './_access-table/access-table';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'administración de accesos — portal de modelos',
};

export default async function ModelsAccessPage() {
  const supabase = await createClient();

  // 1. Verificar sesión de administrador
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Cargar modelos alfabéticamente (vista rápida sin fotos)
  const { data: models } = await supabase
    .from('models')
    .select('id, full_name, alias, email, login_password, country, gender')
    .order('full_name', { ascending: true });

  const modelsList = models || [];

  return (
    <div className="flex flex-1 h-full min-h-0 flex-col gap-6">
      <header className="flex flex-col gap-2 pb-4 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-display font-semibold tracking-tight">
            Accesos de Modelos
          </h1>
          <span aria-hidden className="h-5 w-px bg-border" />
          <p className="text-label text-muted-foreground whitespace-nowrap">{modelsList.length} talentos</p>
        </div>
      </header>

      <AccessTable initialModels={modelsList} />
    </div>
  );
}
