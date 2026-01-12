import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/utils/errors';
import { getGuatemalaToday } from '@/lib/constants/finance';

export type SmartAlert = {
    id: string;
    type: 'payment_due' | 'invoice_reminder' | 'attention_needed';
    title: string;
    subtitle?: string;
    priority: 'high' | 'medium';
    href: string;
    metadata: {
        project_id?: string;
        model_id?: string;
        assignment_id?: string;
    };
};

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const alerts: SmartAlert[] = [];
        // Fecha de hoy en timezone Guatemala (GMT-6)
        const today = getGuatemalaToday();

        // 1. ALERTAS DE PAGO A TALENTOS
        // Buscar model_assignments donde:
        // - payment_status != 'paid'
        // - El proyecto ya terminó (última fecha del schedule ya pasó)
        const { data: unpaidAssignments, error: assignmentsError } = await supabase
            .from('model_assignments')
            .select(`
                id,
                model_id,
                project_id,
                payment_status,
                daily_fee,
                models!inner(alias, full_name),
                projects!inner(id, project_name, user_id, schedule, status)
            `)
            .neq('payment_status', 'paid')
            .eq('projects.user_id', user.id);

        if (assignmentsError) {
            logError(assignmentsError, { route: '/api/alerts', phase: 'unpaid_assignments' });
        } else if (unpaidAssignments) {
            for (const assignment of unpaidAssignments) {
                const project = assignment.projects as { id: string; project_name: string; schedule: { date: string }[] | null; status: string };
                const model = assignment.models as { alias: string | null; full_name: string | null };

                // Verificar si el proyecto ya terminó (última fecha del schedule ya pasó)
                if (project.schedule && project.schedule.length > 0) {
                    const lastDate = new Date(project.schedule[project.schedule.length - 1].date);
                    lastDate.setHours(23, 59, 59, 999);

                    if (lastDate < today) {
                        alerts.push({
                            id: `payment_${assignment.id}`,
                            type: 'payment_due',
                            title: `Pagar a ${model.alias || model.full_name || 'Talento'}`,
                            subtitle: project.project_name,
                            priority: 'high',
                            href: `/dashboard/finances?model=${assignment.model_id}`,
                            metadata: {
                                project_id: project.id,
                                model_id: assignment.model_id,
                                assignment_id: assignment.id,
                            },
                        });
                    }
                }
            }
        }

        // 2. ALERTAS DE FACTURACIÓN
        // Proyectos completados hace más de 1 día sin facturar
        // Solo mostrar si tienen revenue definido (monto a cobrar)
        const { data: unfactoredProjects, error: projectsError } = await supabase
            .from('projects')
            .select('id, project_name, schedule, client_payment_status, status, revenue')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .gt('revenue', 0)
            .or('client_payment_status.is.null,client_payment_status.neq.paid');

        if (projectsError) {
            logError(projectsError, { route: '/api/alerts', phase: 'unfactored_projects' });
        } else if (unfactoredProjects) {
            for (const project of unfactoredProjects) {
                const schedule = project.schedule as { date: string }[] | null;

                if (schedule && schedule.length > 0) {
                    const lastDate = new Date(schedule[schedule.length - 1].date);
                    const oneDayAfter = new Date(lastDate);
                    oneDayAfter.setDate(oneDayAfter.getDate() + 1);
                    oneDayAfter.setHours(0, 0, 0, 0);

                    if (today >= oneDayAfter) {
                        alerts.push({
                            id: `invoice_${project.id}`,
                            type: 'invoice_reminder',
                            title: `Facturar proyecto`,
                            subtitle: project.project_name,
                            priority: 'medium',
                            href: `/dashboard/finances`,
                            metadata: {
                                project_id: project.id,
                            },
                        });
                    }
                }
            }
        }

        // 3. ALERTAS DE ATENCIÓN: Proyectos completados sin modelos aprobados
        // Esto ayuda a identificar proyectos que necesitan revisión manual
        const { data: noApprovedProjects, error: noApprovedError } = await supabase
            .from('projects')
            .select(`
                id,
                project_name,
                projects_models!projects_models_project_id_fkey(client_selection)
            `)
            .eq('user_id', user.id)
            .eq('status', 'completed');

        if (noApprovedError) {
            logError(noApprovedError, { route: '/api/alerts', phase: 'no_approved_projects' });
        } else if (noApprovedProjects) {
            for (const project of noApprovedProjects) {
                const models = project.projects_models as { client_selection: string }[] | null;
                const hasApproved = models?.some(m => m.client_selection === 'approved');

                // Si no tiene modelos aprobados, agregar alerta
                if (!hasApproved && models && models.length > 0) {
                    alerts.push({
                        id: `attention_${project.id}`,
                        type: 'attention_needed',
                        title: `Proyecto sin talentos aprobados`,
                        subtitle: project.project_name,
                        priority: 'high',
                        href: `/dashboard/projects/${project.id}`,
                        metadata: {
                            project_id: project.id,
                        },
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: alerts,
        });
    } catch (err) {
        logError(err, { route: '/api/alerts' });
        return NextResponse.json({ success: false, error: 'Could not fetch alerts' }, { status: 500 });
    }
}
