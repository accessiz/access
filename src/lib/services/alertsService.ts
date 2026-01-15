import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/utils/errors';
import { getGuatemalaToday } from '@/lib/constants/finance';

export type SmartAlert = {
    id: string;
    type: 'payment_due' | 'invoice_reminder' | 'attention_needed' | 'missing_revenue';
    title: string;
    subtitle?: string;
    priority: 'high' | 'medium';
    href: string;
    metadata: {
        project_id?: string;
        model_id?: string;
        assignment_id?: string;
        amount?: number;
        currency?: string;
    };
    is_dismissed?: boolean;
    problem: string;    // Don Norman: Context/Problem
    solution: string;   // Don Norman: Solution/Action
};

export async function getComputedAlerts(userId: string, includeDismissed: boolean = false): Promise<SmartAlert[]> {
    try {
        const supabase = await createClient();
        const alerts: SmartAlert[] = [];
        // Fecha de hoy en timezone Guatemala (GMT-6)
        const today = getGuatemalaToday();

        // Obtener dismissals activos del usuario
        // Si includeDismissed es true, aún necesitamos saber cuáles están dismissed para marcarlos
        const { data: dismissals } = await supabase
            .from('alert_dismissals')
            .select('alert_id')
            .eq('user_id', userId)
            .gt('expires_at', new Date().toISOString());

        const dismissedAlertIds = new Set((dismissals || []).map(d => d.alert_id));

        // 1. ALERTAS DE PAGO A TALENTOS
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
            .eq('projects.user_id', userId);

        if (assignmentsError) {
            logError(assignmentsError, { route: 'alertsService', phase: 'unpaid_assignments' });
        } else if (unpaidAssignments) {
            for (const assignment of unpaidAssignments) {
                const project = assignment.projects as { id: string; project_name: string; schedule: { date: string }[] | null; status: string };
                const model = assignment.models as { alias: string | null; full_name: string | null };

                if (project.schedule && project.schedule.length > 0) {
                    const lastDate = new Date(project.schedule[project.schedule.length - 1].date);
                    lastDate.setHours(23, 59, 59, 999);

                    if (lastDate < today) {
                        const alertId = `payment_${assignment.id}`;
                        const isDismissed = dismissedAlertIds.has(alertId);

                        if (!isDismissed || includeDismissed) {
                            alerts.push({
                                id: alertId,
                                type: 'payment_due',
                                title: `Pagar a ${model.alias || model.full_name || 'Talento'}`,
                                subtitle: project.project_name,
                                priority: 'high',
                                href: `/dashboard/finances?model=${assignment.model_id}`,
                                metadata: {
                                    project_id: project.id,
                                    model_id: assignment.model_id,
                                    assignment_id: assignment.id,
                                    amount: assignment.daily_fee ?? undefined,
                                },
                                is_dismissed: isDismissed,
                                problem: `Este talento ya terminó su trabajo y espera su pago.`,
                                solution: "Págale para mantener una buena relación."
                            });
                        }
                    }
                }
            }
        }

        // 2. ALERTAS DE FACTURACIÓN
        const { data: unfactoredProjects, error: projectsError } = await supabase
            .from('projects')
            .select('id, project_name, schedule, client_payment_status, status, revenue, currency')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gt('revenue', 0)
            .or('client_payment_status.is.null,client_payment_status.neq.paid');

        if (projectsError) {
            logError(projectsError, { route: 'alertsService', phase: 'unfactored_projects' });
        } else if (unfactoredProjects) {
            for (const project of unfactoredProjects) {
                const schedule = project.schedule as { date: string }[] | null;

                if (schedule && schedule.length > 0) {
                    const lastDate = new Date(schedule[schedule.length - 1].date);
                    const oneDayAfter = new Date(lastDate);
                    oneDayAfter.setDate(oneDayAfter.getDate() + 1);
                    oneDayAfter.setHours(0, 0, 0, 0);

                    if (today >= oneDayAfter) {
                        const alertId = `invoice_${project.id}`;
                        const isDismissed = dismissedAlertIds.has(alertId);

                        if (!isDismissed || includeDismissed) {
                            alerts.push({
                                id: alertId,
                                type: 'invoice_reminder',
                                title: `Facturar proyecto`,
                                subtitle: project.project_name,
                                priority: 'medium',
                                href: `/dashboard/finances?tab=clients`,
                                metadata: {
                                    project_id: project.id,
                                    amount: project.revenue ?? undefined,
                                    currency: project.currency || 'GTQ',
                                },
                                is_dismissed: isDismissed,
                                problem: `El proyecto terminó pero aún no lo has cobrado.`,
                                solution: "Crea la factura y registra el cobro."
                            });
                        }
                    }
                }
            }
        }

        // 3. ALERTAS DE ATENCIÓN
        const { data: noApprovedProjects, error: noApprovedError } = await supabase
            .from('projects')
            .select(`
                id,
                project_name,
                projects_models!projects_models_project_id_fkey(client_selection)
            `)
            .eq('user_id', userId)
            .eq('status', 'completed');

        if (noApprovedError) {
            logError(noApprovedError, { route: 'alertsService', phase: 'no_approved_projects' });
        } else if (noApprovedProjects) {
            for (const project of noApprovedProjects) {
                const models = project.projects_models as { client_selection: string }[] | null;
                const hasApproved = models?.some(m => m.client_selection === 'approved');

                if (!hasApproved && models && models.length > 0) {
                    const alertId = `attention_${project.id}`;
                    const isDismissed = dismissedAlertIds.has(alertId);

                    if (!isDismissed || includeDismissed) {
                        alerts.push({
                            id: alertId,
                            type: 'attention_needed',
                            title: `Sin talentos aprobados`,
                            subtitle: project.project_name,
                            priority: 'high',
                            href: `/dashboard/projects/${project.id}`,
                            metadata: {
                                project_id: project.id,
                            },
                            is_dismissed: isDismissed,
                            problem: `El proyecto terminó sin talentos asignados.`,
                            solution: "Selecciona quiénes trabajaron en este proyecto."
                        });
                    }
                }
            }
        }

        // 4. NUEVA ALERTA: Sin monto a cobrar
        const { data: noRevenueProjects, error: noRevenueError } = await supabase
            .from('projects')
            .select(`
                id,
                project_name,
                schedule,
                revenue,
                projects_models!projects_models_project_id_fkey(client_selection)
            `)
            .eq('user_id', userId)
            .eq('status', 'completed')
            .or('revenue.is.null,revenue.eq.0');

        if (noRevenueError) {
            logError(noRevenueError, { route: 'alertsService', phase: 'no_revenue_projects' });
        } else if (noRevenueProjects) {
            for (const project of noRevenueProjects) {
                const models = project.projects_models as { client_selection: string }[] | null;
                const hasApproved = models?.some(m => m.client_selection === 'approved');
                const schedule = project.schedule as { date: string }[] | null;

                if (hasApproved && schedule && schedule.length > 0) {
                    const lastDate = new Date(schedule[schedule.length - 1].date);
                    lastDate.setHours(23, 59, 59, 999);

                    if (lastDate < today) {
                        const alertId = `missing_revenue_${project.id}`;
                        const isDismissed = dismissedAlertIds.has(alertId);

                        if (!isDismissed || includeDismissed) {
                            alerts.push({
                                id: alertId,
                                type: 'missing_revenue',
                                title: `Proyecto sin monto`,
                                subtitle: project.project_name,
                                priority: 'high',
                                href: `/dashboard/projects/${project.id}`,
                                metadata: {
                                    project_id: project.id,
                                },
                                is_dismissed: isDismissed,
                                problem: `Este proyecto no tiene un monto definido.`,
                                solution: "Ingresa el monto para calcular tus ganancias."
                            });
                        }
                    }
                }
            }
        }

        return alerts;

    } catch (err) {
        logError(err, { route: 'alertsService' });
        throw err;
    }
}
