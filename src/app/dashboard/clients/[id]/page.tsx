import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ClientDetailPage from './client-detail-page';

export const dynamic = 'force-dynamic';

type PageProps = {
    params: Promise<{ id: string }>;
};

export type ClientDetailData = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    notes: string | null;
    avatar_url: string | null;
    status: string | null;
    created_at: string | null;
    brands: {
        id: string;
        name: string;
        logo_url: string | null;
    }[];
    projects: {
        id: string;
        project_name: string;
        status: string | null;
        start_date: string | null;
        end_date: string | null;
        default_model_fee: number | null;
        currency: string;
        models_count: number;
    }[];
    kpis: {
        total_projects: number;
        total_revenue: number;
        unique_models: number;
        active_campaigns: number;
    };
    frequent_models: {
        id: string;
        full_name: string;
        alias: string | null;
        cover_path: string | null;
        usage_count: number;
    }[];
};

export default async function ClientPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Obtener datos del cliente con marcas
    const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
            *,
            brands (id, name, logo_url)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (clientError || !clientData) {
        return (
            <div className="p-8 md:p-12 text-center">
                <h1 className="text-heading-24">Cliente no encontrado</h1>
                <p className="text-muted-foreground">El cliente que buscas no existe o no tienes permiso para verlo.</p>
            </div>
        );
    }

    // Obtener proyectos del cliente (por client_id o por client_name)
    // Primero intentamos por client_id
    const { data: projectsDataById, error: _projectsError } = await supabase
        .from('projects')
        .select(`
            id,
            project_name,
            status,
            start_date,
            end_date,
            default_model_fee,
            currency,
            client_id,
            client_name
        `)
        .eq('client_id', id)
        .order('created_at', { ascending: false })
        .limit(10);


    // Si no encontramos por client_id, buscamos por client_name
    let projectsData = projectsDataById;
    if (!projectsData || projectsData.length === 0) {
        const { data: projectsByName } = await supabase
            .from('projects')
            .select(`
                id,
                project_name,
                status,
                start_date,
                end_date,
                default_model_fee,
                currency,
                client_id,
                client_name
            `)
            .ilike('client_name', `%${clientData.name}%`)
            .order('created_at', { ascending: false })
            .limit(10);


        if (projectsByName && projectsByName.length > 0) {
            projectsData = projectsByName;
        }
    }

    // Obtener conteo de modelos aprobados por proyecto
    const projectIds = (projectsData || []).map(p => p.id);
    const modelCountsMap = new Map<string, number>();
    const allModelIds: string[] = [];

    if (projectIds.length > 0) {
        const { data: modelCounts } = await supabase
            .from('projects_models')
            .select('project_id, model_id, client_selection')
            .in('project_id', projectIds)
            .eq('client_selection', 'approved');

        if (modelCounts) {
            modelCounts.forEach(mc => {
                modelCountsMap.set(mc.project_id, (modelCountsMap.get(mc.project_id) || 0) + 1);
                if (mc.model_id) allModelIds.push(mc.model_id);
            });
        }
    }

    // Transformar proyectos con conteo real de modelos
    const projects = (projectsData || []).map(p => ({
        id: p.id,
        project_name: p.project_name,
        status: p.status,
        start_date: p.start_date,
        end_date: p.end_date,
        default_model_fee: p.default_model_fee,
        currency: p.currency || 'GTQ',
        models_count: modelCountsMap.get(p.id) || 0,
    }));

    // Calcular KPIs
    const uniqueModelIds = new Set(allModelIds);
    const totalRevenue = projects.reduce((acc, p) => {
        return acc + ((p.default_model_fee || 0) * p.models_count);
    }, 0);

    const activeCampaigns = projects.filter(p =>
        p.status === 'active' || p.status === 'planning' || p.status === 'in_progress'
    ).length;

    // Contar modelos más usados
    const modelUsageCount = new Map<string, number>();
    allModelIds.forEach(modelId => {
        modelUsageCount.set(modelId, (modelUsageCount.get(modelId) || 0) + 1);
    });

    // Obtener datos de los modelos más usados (top 5)
    const topModelIds = Array.from(modelUsageCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([modelId]) => modelId);

    let frequentModels: ClientDetailData['frequent_models'] = [];
    if (topModelIds.length > 0) {
        const { data: modelsData } = await supabase
            .from('models')
            .select('id, full_name, alias, cover_path')
            .in('id', topModelIds);

        if (modelsData) {
            frequentModels = modelsData.map(m => ({
                id: m.id,
                full_name: m.full_name,
                alias: m.alias,
                cover_path: m.cover_path,
                usage_count: modelUsageCount.get(m.id) || 0,
            })).sort((a, b) => b.usage_count - a.usage_count);
        }
    }

    const clientDetail: ClientDetailData = {
        id: clientData.id,
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        company: clientData.company,
        notes: clientData.notes,
        avatar_url: clientData.avatar_url,
        status: clientData.status,
        created_at: clientData.created_at,
        brands: clientData.brands || [],
        projects,
        kpis: {
            total_projects: projects.length,
            total_revenue: totalRevenue,
            unique_models: uniqueModelIds.size,
            active_campaigns: activeCampaigns,
        },
        frequent_models: frequentModels,
    };

    return <ClientDetailPage client={clientDetail} />;
}
