import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

// Tipos para los parámetros de exportación
type ExportType = 'models' | 'clients';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as ExportType || 'models';
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
        console.error('[Export] Error:', error);
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
    let query = supabase
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

    // Formatear datos para Excel
    const excelData = filteredData.map(item => ({
        'Modelo': item.model_alias || item.model_name,
        'Nombre Completo': item.model_name,
        'Proyecto': item.project_name,
        'Cliente': item.registered_client_name || item.client_name || '-',
        'Marca': item.brand_name || '-',
        'Fecha Trabajo': formatDate(item.first_work_date || ''),
        'Días': item.days_worked,
        'Tarifa/Día': item.daily_fee,
        'Total': item.total_amount,
        'Pagado': item.total_paid,
        'Pendiente': item.pending_amount,
        'Moneda': item.currency,
        'Estado': translatePaymentStatus(item.payment_status),
        'Fecha Pago': item.payment_date ? formatDate(item.payment_date) : '-',
    }));

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Ajustar anchos de columna
    ws['!cols'] = [
        { wch: 20 }, // Modelo
        { wch: 25 }, // Nombre Completo
        { wch: 30 }, // Proyecto
        { wch: 20 }, // Cliente
        { wch: 15 }, // Marca
        { wch: 12 }, // Fecha Trabajo
        { wch: 6 },  // Días
        { wch: 12 }, // Tarifa/Día
        { wch: 12 }, // Total
        { wch: 12 }, // Pagado
        { wch: 12 }, // Pendiente
        { wch: 8 },  // Moneda
        { wch: 12 }, // Estado
        { wch: 12 }, // Fecha Pago
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Pagos a Modelos');

    // Generar buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

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
    let filteredData = data || [];

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

    // Formatear datos para Excel
    const excelData = filteredData.map(item => {
        const subtotal = item.revenue || 0;
        const taxPercent = item.tax_percentage || 12;
        const taxAmount = subtotal * (taxPercent / 100);
        const total = subtotal + taxAmount;

        return {
            'Proyecto': item.project_name,
            'Cliente': (item.client as any)?.name || item.client_name || '-',
            'Marca': (item.brand as any)?.name || '-',
            'Subtotal': subtotal,
            'IVA (%)': taxPercent,
            'Monto IVA': taxAmount,
            'Total': total,
            'Moneda': item.currency || 'GTQ',
            'Estado': translateClientPaymentStatus(item.client_payment_status),
            'Fecha Factura': item.invoice_date ? formatDate(item.invoice_date) : '-',
            'No. Factura': item.invoice_number || '-',
            'Fecha Pago': item.client_payment_date ? formatDate(item.client_payment_date) : '-',
        };
    });

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Ajustar anchos de columna
    ws['!cols'] = [
        { wch: 30 }, // Proyecto
        { wch: 20 }, // Cliente
        { wch: 15 }, // Marca
        { wch: 12 }, // Subtotal
        { wch: 10 }, // IVA (%)
        { wch: 12 }, // Monto IVA
        { wch: 12 }, // Total
        { wch: 8 },  // Moneda
        { wch: 12 }, // Estado
        { wch: 12 }, // Fecha Factura
        { wch: 15 }, // No. Factura
        { wch: 12 }, // Fecha Pago
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Cobros a Clientes');

    // Generar buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

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
