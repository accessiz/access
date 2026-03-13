import { createClient } from '@/lib/supabase/server';
import ClientsClientPage from './clients-client-page';
import { Client, Brand } from '@/lib/types';
import { logError } from '@/lib/utils/errors';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clientes',
};

// Tipo para los datos iniciales que se pasan al componente cliente
type InitialData = {
    clients: ClientWithBrands[];
    count: number;
};

// Tipo extendido para clientes con sus marcas
export type ClientWithBrands = Client & {
    brands: Brand[];
    projectCount: number;
};

export default async function ClientsPage() {
    const supabase = await createClient();

    // Obtenemos el usuario actual
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>No autorizado</div>;
    }

    // Obtenemos los clientes con sus marcas y conteo de proyectos
    const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
      *,
      brands (*),
      projects:projects!projects_client_id_fkey (id)
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (clientsError) {
        logError(clientsError, { action: 'clientsPage.fetch clients' });
    }

    // Transformamos los datos para incluir el conteo de proyectos
    const clients: ClientWithBrands[] = (clientsData || []).map((client) => ({
        ...client,
        brands: client.brands || [],
        projectCount: Array.isArray(client.projects) ? client.projects.length : 0,
    }));

    const initialData: InitialData = {
        clients,
        count: clients.length,
    };

    return <ClientsClientPage initialData={initialData} />;
}
