import { createClient } from '@/lib/supabase/server';
import FinancesClientPage from './finances-client-page';
import { logError } from '@/lib/utils/errors';

// Tipos para el resumen financiero v2 (consolidado por modelo+proyecto)
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'cancelled';

export type FinanceSummaryItem = {
    id: string;                        // ID único compuesto
    model_id: string;
    model_name: string;
    model_alias: string | null;
    project_id: string;
    project_name: string;
    client_name: string | null;
    registered_client_name: string | null;
    brand_name: string | null;
    days_worked: number;               // Días trabajados
    daily_fee: number | null;          // Tarifa por día
    total_amount: number;              // Total = días × tarifa
    first_work_date: string;           // Primera fecha de trabajo
    last_work_date: string;            // Última fecha de trabajo
    payment_status: PaymentStatus | null;
    payment_date: string | null;
    total_paid: number;
    pending_amount: number;
    currency: string;
};

export type FinanceKPIs = {
    totalPending: number;
    totalPaidThisMonth: number;
    pendingCount: number;
    modelsWithPendingPayments: number;
};

type InitialData = {
    items: FinanceSummaryItem[];
    kpis: FinanceKPIs;
};

export default async function FinancesPage() {
    const supabase = await createClient();

    // Obtenemos el usuario actual
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>No autorizado</div>;
    }

    // Obtenemos los datos de la vista finance_summary v2
    const { data: summaryData, error: summaryError } = await supabase
        .from('finance_summary')
        .select('*')
        .eq('user_id', user.id)
        .order('last_work_date', { ascending: false });

    console.log('[FinancesPage] summaryData raw:', JSON.stringify(summaryData, null, 2));
    console.log('[FinancesPage] summaryError:', summaryError);

    if (summaryError) {
        logError(summaryError, { action: 'financesPage.fetch finance_summary' });
    }

    // Filtrar y mapear datos
    const items: FinanceSummaryItem[] = (summaryData || [])
        .filter(item =>
            item.id &&
            item.model_id &&
            item.project_id &&
            item.model_name &&
            item.project_name
        )
        .map(item => ({
            id: item.id!,
            model_id: item.model_id!,
            model_name: item.model_name!,
            model_alias: item.model_alias,
            project_id: item.project_id!,
            project_name: item.project_name!,
            client_name: item.client_name,
            registered_client_name: item.registered_client_name,
            brand_name: item.brand_name,
            days_worked: Number(item.days_worked) || 0,
            daily_fee: item.daily_fee ? Number(item.daily_fee) : null,
            total_amount: Number(item.total_amount) || 0,
            first_work_date: item.first_work_date!,
            last_work_date: item.last_work_date!,
            payment_status: item.payment_status as PaymentStatus | null,
            payment_date: item.payment_date,
            total_paid: Number(item.total_paid) || 0,
            pending_amount: Number(item.pending_amount) || 0,
            currency: item.currency || 'GTQ',
        }));

    // Calcular KPIs
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const pendingItems = items.filter(i => i.payment_status === 'pending' || i.payment_status === 'partial');
    const paidThisMonth = items.filter(i =>
        i.payment_status === 'paid' &&
        i.payment_date &&
        new Date(i.payment_date) >= startOfMonth
    );

    const kpis: FinanceKPIs = {
        totalPending: pendingItems.reduce((acc, i) => acc + (i.pending_amount || 0), 0),
        totalPaidThisMonth: paidThisMonth.reduce((acc, i) => acc + (i.total_paid || 0), 0),
        pendingCount: pendingItems.length,
        modelsWithPendingPayments: new Set(pendingItems.map(i => i.model_id)).size,
    };

    const initialData: InitialData = {
        items,
        kpis,
    };

    return <FinancesClientPage initialData={initialData} />;
}
