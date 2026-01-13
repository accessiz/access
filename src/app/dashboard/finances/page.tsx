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
    daily_fee: number | null;          // Tarifa por día (efectivo)
    total_amount: number;              // Total efectivo = días × tarifa
    daily_trade_fee: number | null;    // Tarifa canje por día
    total_trade_value: number | null;  // Total canje
    trade_category: string | null;     // Categoría del canje
    trade_details: string | null;      // Detalles del canje
    first_work_date: string;           // Primera fecha de trabajo
    last_work_date: string;            // Última fecha de trabajo
    payment_status: PaymentStatus | null;
    payment_date: string | null;
    payment_type: 'cash' | 'trade' | 'mixed' | null;  // Tipo de pago
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
    subtotal: number;                    // Cash amount
    trade_value: number;                 // Trade value from client
    payment_type: 'cash' | 'trade' | 'mixed';  // Client payment type
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
    // Incluimos schedule y projects_models para validar condiciones
    const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
            id,
            project_name,
            client_name,
            revenue,
            client_trade_revenue,
            client_payment_type,
            tax_percentage,
            client_payment_status,
            client_payment_date,
            invoice_number,
            invoice_date,
            currency,
            created_at,
            status,
            schedule,
            client:clients(name),
            brand:brands(name),
            projects_models!projects_models_project_id_fkey(client_selection)
        `)
        .eq('user_id', user.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });

    type ProjectBillingRow = {
        id: string;
        project_name: string;
        client_name: string | null;
        revenue: number | null;
        client_trade_revenue: number | null;  // Trade value from client
        client_payment_type: string | null;   // cash, trade, or mixed
        tax_percentage: number | null;
        client_payment_status: string | null;
        client_payment_date: string | null;
        invoice_number: string | null;
        invoice_date: string | null;
        currency: string | null;
        created_at: string;
        status: string;
        schedule: { date: string }[] | null;
        client: { name: string } | null;
        brand: { name: string } | null;
        projects_models: { client_selection: string }[] | null;
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
            daily_trade_fee: item.daily_trade_fee ? Number(item.daily_trade_fee) : null,
            total_trade_value: item.total_trade_value ? Number(item.total_trade_value) : null,
            trade_category: item.trade_category || null,
            trade_details: item.trade_details || null,
            first_work_date: item.first_work_date!,
            last_work_date: item.last_work_date!,
            payment_status: item.payment_status as PaymentStatus | null,
            payment_date: item.payment_date,
            payment_type: item.payment_type as 'cash' | 'trade' | 'mixed' | null,
            total_paid: Number(item.total_paid) || 0,
            pending_amount: Number(item.pending_amount) || 0,
            currency: item.currency || 'GTQ',
        }));

    // Obtener fecha actual en Guatemala para comparar
    const { getGuatemalaTodayString } = await import('@/lib/constants/finance');
    const todayStr = getGuatemalaTodayString();

    // Mapear cobros a clientes
    // Condiciones para "Por Cobrar":
    // 1. revenue > 0 O client_trade_revenue > 0 (hay monto definido, sea efectivo o canje)
    // 2. status = 'completed' (proyecto terminado)
    // 3. Tiene al menos 1 modelo aprobado
    // 4. La última fecha del proyecto ya pasó (opcional - si hay schedule)
    const clientBilling: ClientBillingItem[] = ((projectsData || []) as ProjectBillingRow[])
        .filter(p => {
            // Condición 1: Tiene revenue (efectivo) O client_trade_revenue (canje)
            const hasCashRevenue = (p.revenue ?? 0) > 0;
            const hasTradeRevenue = (p.client_trade_revenue ?? 0) > 0;
            if (!hasCashRevenue && !hasTradeRevenue) return false;

            // Condición 2: Status completado
            if (p.status !== 'completed') return false;

            // Condición 3: Tiene al menos un modelo aprobado
            const hasApprovedModel = p.projects_models?.some(pm => pm.client_selection === 'approved');
            if (!hasApprovedModel) return false;

            // Condición 4: Si tiene schedule, verificar que la última fecha ya pasó
            // Si NO tiene schedule, asumimos que ya pasó (proyecto completado = listo para cobro)
            if (p.schedule && Array.isArray(p.schedule) && p.schedule.length > 0) {
                // El schedule es un array de objetos {date, startTime, endTime}
                const dates = p.schedule
                    .map(s => typeof s === 'object' && s.date ? s.date : null)
                    .filter((d): d is string => d !== null);

                if (dates.length > 0) {
                    const lastDate = dates.sort().pop() || '';
                    // Solo excluir si la fecha es FUTURA (> hoy, no >= hoy)
                    if (lastDate > todayStr) return false;
                }
            }

            return true;
        })
        .map(p => {
            const paymentType = (p.client_payment_type as 'cash' | 'trade' | 'mixed') || 'cash';

            // Filtrar valores según el tipo de pago para evitar datos residuales
            let cashSubtotal = Number(p.revenue) || 0;
            let tradeValue = Number(p.client_trade_revenue) || 0;

            if (paymentType === 'cash') {
                tradeValue = 0;
            } else if (paymentType === 'trade') {
                cashSubtotal = 0;
            }
            // Si es 'mixed', mantenemos ambos valores

            const taxPercent = Number(p.tax_percentage) || 12;
            // Tax only applies to cash, not trade
            const taxAmount = cashSubtotal * (taxPercent / 100);
            const totalWithTax = cashSubtotal + taxAmount;

            return {
                project_id: p.id,
                project_name: p.project_name,
                client_name: p.client_name,
                registered_client_name: p.client?.name || null,
                brand_name: p.brand?.name || null,
                subtotal: cashSubtotal,
                trade_value: tradeValue,
                payment_type: paymentType,
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

    // Margen bruto (solo cobros RECIBIDOS - pagos REALIZADOS)
    const paidClientItems = clientBilling.filter(i => i.payment_status === 'paid');
    const paidModelItems = modelPayments.filter(i => i.payment_status === 'paid');
    const totalClientRevenue = paidClientItems.reduce((acc, i) => acc + i.subtotal, 0);
    const totalModelCosts = paidModelItems.reduce((acc, i) => acc + i.total_amount, 0);

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

