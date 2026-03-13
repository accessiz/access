import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';
import { logger } from '@/lib/logger';
import { applyRateLimit, strictLimiter } from '@/lib/utils/rate-limit';

// Tipos para los parámetros de exportación
type ExportType = 'models' | 'clients';

export async function GET(request: NextRequest) {
    const blocked = applyRateLimit(request, strictLimiter);
    if (blocked) return blocked;

    const searchParams = request.nextUrl.searchParams;
    const rawType = searchParams.get('type');
    const VALID_EXPORT_TYPES: ExportType[] = ['models', 'clients'];
    const type: ExportType = (rawType && VALID_EXPORT_TYPES.includes(rawType as ExportType))
        ? rawType as ExportType
        : 'models';
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const startDay = searchParams.get('startDay');
    const endDay = searchParams.get('endDay');
    const clientId = searchParams.get('client_id');
    const modelId = searchParams.get('model_id');

    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        if (type === 'models') {
            return await exportModelPayments(supabase, user.id, { month, year, startDay, endDay, modelId });
        } else if (type === 'clients') {
            return await exportClientBilling(supabase, user.id, { month, year, startDay, endDay, clientId });
        }

        return NextResponse.json({ error: 'Tipo de exportación inválido' }, { status: 400 });
    } catch (error) {
        logger.fromError(error, { route: 'finances/export', action: 'GET' });
        return NextResponse.json({ error: 'Error al generar el archivo' }, { status: 500 });
    }
}

// Exportar pagos a modelos
async function exportModelPayments(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    filters: { month?: string | null; year?: string | null; startDay?: string | null; endDay?: string | null; modelId?: string | null }
) {
    // Obtener datos de la vista finance_summary
    const query = supabase
        .from('finance_summary')
        .select('*')
        .eq('user_id', userId)
        .order('last_work_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filtrar por mes/año si se especifica
    let filteredData = data || [];

    if (filters.year) {
        const yearNum = parseInt(filters.year);
        filteredData = filteredData.filter(item => {
            if (!item.last_work_date) return false;
            const date = new Date(item.last_work_date);
            return date.getFullYear() === yearNum;
        });
    }

    if (filters.month) {
        const monthNum = parseInt(filters.month);
        filteredData = filteredData.filter(item => {
            if (!item.last_work_date) return false;
            const date = new Date(item.last_work_date);
            return date.getMonth() + 1 === monthNum;
        });
    }

    // Filtrar por quincena (startDay - endDay)
    if (filters.startDay && filters.endDay) {
        const startDayNum = parseInt(filters.startDay);
        const endDayNum = parseInt(filters.endDay);
        filteredData = filteredData.filter(item => {
            if (!item.last_work_date) return false;
            const date = new Date(item.last_work_date);
            const day = date.getDate();
            return day >= startDayNum && day <= endDayNum;
        });
    }

    if (filters.modelId) {
        filteredData = filteredData.filter(item => item.model_id === filters.modelId);
    }

    // Crear workbook con ExcelJS
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Pagos a Modelos');

    // Definir columnas con headers y anchos (versión mejorada)
    ws.columns = [
        { header: 'Modelo', key: 'modelo', width: 20 },
        { header: 'Nombre Completo', key: 'nombre_completo', width: 25 },
        { header: 'Proyecto', key: 'proyecto', width: 30 },
        { header: 'Cliente', key: 'cliente', width: 20 },
        { header: 'Marca', key: 'marca', width: 15 },
        { header: 'Primera Fecha', key: 'primera_fecha', width: 12 },
        { header: 'Última Fecha', key: 'ultima_fecha', width: 12 },
        { header: 'Días', key: 'dias', width: 6 },
        { header: 'Tipo Pago', key: 'tipo_pago', width: 12 },
        { header: 'Tarifa/Día', key: 'tarifa_dia', width: 12 },
        { header: 'Tarifa Canje', key: 'tarifa_canje', width: 12 },
        { header: 'Total Efectivo', key: 'total_efectivo', width: 14 },
        { header: 'Total Canje', key: 'total_canje', width: 12 },
        { header: 'Categoría Canje', key: 'categoria_canje', width: 15 },
        { header: 'Pagado', key: 'pagado', width: 12 },
        { header: 'Pendiente', key: 'pendiente', width: 12 },
        { header: 'Moneda', key: 'moneda', width: 8 },
        { header: 'Estado', key: 'estado', width: 12 },
        { header: 'Fecha Pago', key: 'fecha_pago', width: 12 },
    ];

    // Agregar filas de datos
    filteredData.forEach(item => {
        // Determinar tipo de pago basado en datos disponibles
        const hasCash = item.daily_fee && item.daily_fee > 0;
        const hasTrade = item.daily_trade_fee && item.daily_trade_fee > 0;
        let tipoPago = 'Efectivo';
        if (hasCash && hasTrade) tipoPago = 'Mixto';
        else if (hasTrade && !hasCash) tipoPago = 'Canje';

        ws.addRow({
            modelo: item.model_alias || item.model_name,
            nombre_completo: item.model_name,
            proyecto: item.project_name,
            cliente: item.registered_client_name || item.client_name || '-',
            marca: item.brand_name || '-',
            primera_fecha: formatDate(item.first_work_date || ''),
            ultima_fecha: formatDate(item.last_work_date || ''),
            dias: item.days_worked,
            tipo_pago: tipoPago,
            tarifa_dia: item.daily_fee || 0,
            tarifa_canje: item.daily_trade_fee || 0,
            total_efectivo: item.total_amount || 0,
            total_canje: item.total_trade_value || 0,
            categoria_canje: item.trade_category || '-',
            pagado: item.total_paid || 0,
            pendiente: item.pending_amount || 0,
            moneda: item.currency || 'GTQ',
            estado: translatePaymentStatus(item.payment_status),
            fecha_pago: item.payment_date ? formatDate(item.payment_date) : '-',
        });
    });

    // Estilizar header
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Generar buffer
    const buf = await wb.xlsx.writeBuffer();

    // Nombre del archivo
    const now = new Date();
    const quincenaSuffix = filters.startDay === '1' ? '_Q1' : filters.startDay === '16' ? '_Q2' : '';
    const fileName = filters.month && filters.year
        ? `pagos_modelos_${filters.year}_${filters.month.padStart(2, '0')}${quincenaSuffix}.xlsx`
        : `pagos_modelos_${now.getFullYear()}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getDate().toString().padStart(2, '0')}.xlsx`;

    return new NextResponse(buf, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${fileName}"`,
        },
    });
}

// Exportar cobros a clientes
async function exportClientBilling(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    filters: { month?: string | null; year?: string | null; startDay?: string | null; endDay?: string | null; clientId?: string | null }
) {
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

    // Consulta para proyectos con datos de facturación
    let query = supabase
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
        .eq('user_id', userId)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });

    if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filtrar por mes/año si se especifica
    let filteredData = (data || []) as ProjectBillingRow[];

    if (filters.year) {
        const yearNum = parseInt(filters.year);
        filteredData = filteredData.filter(item => {
            const date = new Date(item.created_at);
            return date.getFullYear() === yearNum;
        });
    }

    if (filters.month) {
        const monthNum = parseInt(filters.month);
        filteredData = filteredData.filter(item => {
            const date = new Date(item.created_at);
            return date.getMonth() + 1 === monthNum;
        });
    }

    // Filtrar por quincena (startDay - endDay)
    if (filters.startDay && filters.endDay) {
        const startDayNum = parseInt(filters.startDay);
        const endDayNum = parseInt(filters.endDay);
        filteredData = filteredData.filter(item => {
            const date = new Date(item.created_at);
            const day = date.getDate();
            return day >= startDayNum && day <= endDayNum;
        });
    }

    // Crear workbook con ExcelJS
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Cobros a Clientes');

    // Definir columnas con headers y anchos (versión mejorada)
    ws.columns = [
        { header: 'Proyecto', key: 'proyecto', width: 30 },
        { header: 'Cliente', key: 'cliente', width: 20 },
        { header: 'Marca', key: 'marca', width: 15 },
        { header: 'Tipo Pago', key: 'tipo_pago', width: 12 },
        { header: 'Subtotal Efectivo', key: 'subtotal', width: 16 },
        { header: 'Valor Canje', key: 'valor_canje', width: 12 },
        { header: 'IVA (%)', key: 'iva_percent', width: 10 },
        { header: 'Monto IVA', key: 'iva_monto', width: 12 },
        { header: 'Total con IVA', key: 'total', width: 12 },
        { header: 'Moneda', key: 'moneda', width: 8 },
        { header: 'Estado', key: 'estado', width: 12 },
        { header: 'Fecha Factura', key: 'fecha_factura', width: 12 },
        { header: 'No. Factura', key: 'no_factura', width: 15 },
        { header: 'Fecha Pago', key: 'fecha_pago', width: 12 },
        { header: 'Fecha Creación', key: 'fecha_creacion', width: 14 },
    ];

    // Agregar filas de datos
    filteredData.forEach((item) => {
        const subtotal = item.revenue || 0;
        const tradeValue = (item as unknown as { client_trade_revenue?: number }).client_trade_revenue || 0;
        const taxPercent = item.tax_percentage || 12;
        const taxAmount = subtotal * (taxPercent / 100);
        const total = subtotal + taxAmount;

        // Determinar tipo de pago
        let tipoPago = 'Efectivo';
        if (subtotal > 0 && tradeValue > 0) tipoPago = 'Mixto';
        else if (tradeValue > 0 && subtotal === 0) tipoPago = 'Canje';

        ws.addRow({
            proyecto: item.project_name,
            cliente: item.client?.name || item.client_name || '-',
            marca: item.brand?.name || '-',
            tipo_pago: tipoPago,
            subtotal: subtotal,
            valor_canje: tradeValue,
            iva_percent: taxPercent,
            iva_monto: taxAmount,
            total: total,
            moneda: item.currency || 'GTQ',
            estado: translateClientPaymentStatus(item.client_payment_status),
            fecha_factura: item.invoice_date ? formatDate(item.invoice_date) : '-',
            no_factura: item.invoice_number || '-',
            fecha_pago: item.client_payment_date ? formatDate(item.client_payment_date) : '-',
            fecha_creacion: formatDate(item.created_at),
        });
    });

    // Estilizar header
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Generar buffer
    const buf = await wb.xlsx.writeBuffer();

    // Nombre del archivo
    const now = new Date();
    const quincenaSuffix = filters.startDay === '1' ? '_Q1' : filters.startDay === '16' ? '_Q2' : '';
    const fileName = filters.month && filters.year
        ? `cobros_clientes_${filters.year}_${filters.month.padStart(2, '0')}${quincenaSuffix}.xlsx`
        : `cobros_clientes_${now.getFullYear()}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getDate().toString().padStart(2, '0')}.xlsx`;

    return new NextResponse(buf, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${fileName}"`,
        },
    });
}

// Helpers
function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-GT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return '-';
    }
}

function translatePaymentStatus(status: string | null): string {
    const map: Record<string, string> = {
        pending: 'Pendiente',
        paid: 'Pagado',
        partial: 'Parcial',
        cancelled: 'Cancelado',
    };
    return map[status || 'pending'] || 'Pendiente';
}

function translateClientPaymentStatus(status: string | null): string {
    const map: Record<string, string> = {
        pending: 'Pendiente',
        invoiced: 'Facturado',
        paid: 'Pagado',
    };
    return map[status || 'pending'] || 'Pendiente';
}
