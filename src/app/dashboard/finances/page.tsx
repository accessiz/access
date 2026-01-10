import { createClient } from '@/lib/supabase/server';
import FinancesClientPage from './finances-client-page';
import { logError } from '@/lib/utils/errors';

// Tipos para el resumen financiero v2 (consolidado por modelo+proyecto)
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'cancelled';
export type ClientPaymentStatus = 'pending' | 'invoiced' | 'paid';

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

// Tipo para cobros a clientes
export type ClientBillingItem = {
    project_id: string;
    project_name: string;
    client_name: string | null;
    registered_client_name: string | null;
    brand_name: string | null;
    subtotal: number;
    tax_percentage: number;
    tax_amount: number;
    total_with_tax: number;
    currency: string;
    payment_status: ClientPaymentStatus;
    payment_date: string | null;
    invoice_number: string | null;
    invoice_date: string | null;
    created_at: string;
};

export type FinanceKPIs = {
    // Pagos a Modelos
    totalPendingModels: number;
    totalPaidModelsThisMonth: number;
    pendingModelPayments: number;
    modelsWithPendingPayments: number;
    // Cobros a Clientes
    totalPendingClients: number;
    totalReceivedThisMonth: number;
    pendingClientPayments: number;
    // Margen
    grossMargin: number;
};

type InitialData = {
    modelPayments: FinanceSummaryItem[];
    clientBilling: ClientBillingItem[];
    kpis: FinanceKPIs;
};

export default async function FinancesPage() {
    const supabase = await createClient();

    // Obtenemos el usuario actual
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>No autorizado</div>;
    }

    // 1. Obtener pagos a modelos de la vista finance_summary v2
    const { data: summaryData, error: summaryError } = await supabase
        .from('finance_summary')
        .select('*')
        .eq('user_id', user.id)
        .order('last_work_date', { ascending: false });

    if (summaryError) {
        logError(summaryError, { action: 'financesPage.fetch finance_summary' });
    }

    // 2. Obtener cobros a clientes (proyectos con datos de facturación)
    const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
            id,
            project_name,
            client_name,
            revenue,
            tax_percentage,
            client_payment_status,
            client_payment_date,
            invoice_number,
            invoice_date,
            currency,
            created_at,
            client:clients(name),
            brand:brands(name)
        `)
        .eq('user_id', user.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });

    type ProjectBillingRow = {
        id: string;
        project_name: string;
        client_name: string | null;
        revenue: number | null;
        tax_percentage: number | null;
        client_payment_status: string | null;
        client_payment_date: string | null;
        invoice_number: string | null;
        invoice_date: string | null;
        currency: string | null;
        created_at: string;
        client: { name: string } | null;
        brand: { name: string } | null;
    };

    if (projectsError) {
        logError(projectsError, { action: 'financesPage.fetch projects billing' });
    }

    // Mapear pagos a modelos
    const modelPayments: FinanceSummaryItem[] = (summaryData || [])
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

    // Mapear cobros a clientes
    const clientBilling: ClientBillingItem[] = ((projectsData || []) as ProjectBillingRow[])
        .filter(p => p.revenue && p.revenue > 0)
        .map(p => {
            const subtotal = Number(p.revenue) || 0;
            const taxPercent = Number(p.tax_percentage) || 12;
            const taxAmount = subtotal * (taxPercent / 100);
            const totalWithTax = subtotal + taxAmount;

            return {
                project_id: p.id,
                project_name: p.project_name,
                client_name: p.client_name,
                registered_client_name: p.client?.name || null,
                brand_name: p.brand?.name || null,
                subtotal,
                tax_percentage: taxPercent,
                tax_amount: taxAmount,
                total_with_tax: totalWithTax,
                currency: p.currency || 'GTQ',
                payment_status: (p.client_payment_status as ClientPaymentStatus) || 'pending',
                payment_date: p.client_payment_date,
                invoice_number: p.invoice_number,
                invoice_date: p.invoice_date,
                created_at: p.created_at,
            };
        });

    // Calcular KPIs
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // KPIs de Pagos a Modelos
    const pendingModelItems = modelPayments.filter(i => i.payment_status === 'pending' || i.payment_status === 'partial');
    const paidModelsThisMonth = modelPayments.filter(i =>
        i.payment_status === 'paid' &&
        i.payment_date &&
        new Date(i.payment_date) >= startOfMonth
    );

    // KPIs de Cobros a Clientes
    const pendingClientItems = clientBilling.filter(i => i.payment_status === 'pending' || i.payment_status === 'invoiced');
    const receivedThisMonth = clientBilling.filter(i =>
        i.payment_status === 'paid' &&
        i.payment_date &&
        new Date(i.payment_date) >= startOfMonth
    );

    // Margen bruto (cobros - pagos)
    const totalClientRevenue = clientBilling.reduce((acc, i) => acc + i.subtotal, 0);
    const totalModelCosts = modelPayments.reduce((acc, i) => acc + i.total_amount, 0);

    const kpis: FinanceKPIs = {
        // Pagos a Modelos
        totalPendingModels: pendingModelItems.reduce((acc, i) => acc + (i.pending_amount || 0), 0),
        totalPaidModelsThisMonth: paidModelsThisMonth.reduce((acc, i) => acc + (i.total_paid || 0), 0),
        pendingModelPayments: pendingModelItems.length,
        modelsWithPendingPayments: new Set(pendingModelItems.map(i => i.model_id)).size,
        // Cobros a Clientes
        totalPendingClients: pendingClientItems.reduce((acc, i) => acc + i.total_with_tax, 0),
        totalReceivedThisMonth: receivedThisMonth.reduce((acc, i) => acc + i.total_with_tax, 0),
        pendingClientPayments: pendingClientItems.length,
        // Margen
        grossMargin: totalClientRevenue - totalModelCosts,
    };

    const initialData: InitialData = {
        modelPayments,
        clientBilling,
        kpis,
    };

    return <FinancesClientPage initialData={initialData} />;
}

