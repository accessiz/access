import { Resend } from 'resend';
import { serverEnv, env } from '@/lib/env';

/** Escapes HTML characters to prevent injection in email templates */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let _resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!_resendClient) {
    const apiKey = serverEnv.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Missing RESEND_API_KEY environment variable.');
    }
    _resendClient = new Resend(apiKey);
  }
  return _resendClient;
}

const SCOUTING_EMAIL = 'scouting@izmanagementglobal.com';

interface ModelInfo {
  alias: string;
  fullName: string;
  gender: string;
  country: string;
}

interface ProjectCompletionEmailParams {
  projectName: string;
  clientName: string | null;
  publicId: string;
  approvedModels: ModelInfo[];
}

export async function sendProjectCompletionEmail({
  projectName,
  clientName,
  publicId,
  approvedModels,
}: ProjectCompletionEmailParams): Promise<boolean> {
  try {
    const resend = getResendClient();
    const fromEmail = serverEnv.RESEND_FROM_EMAIL;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const totalApproved = approvedModels.length;

    // Split approved models by gender
    const men = approvedModels.filter(m => m.gender?.toLowerCase() === 'male');
    const women = approvedModels.filter(m => m.gender?.toLowerCase() === 'female');
    const other = approvedModels.filter(
      m => m.gender?.toLowerCase() !== 'male' && m.gender?.toLowerCase() !== 'female'
    );

    const subject = totalApproved > 0
      ? `✅ ${totalApproved} Modelos Aprobados — ${projectName} (${clientName || 'Cliente'})`
      : `⚠️ Selección Finalizada (0 Aprobados) — ${projectName} (${clientName || 'Cliente'})`;

    // Render lists helper
    const renderModelTable = (title: string, list: ModelInfo[], titleColor: string) => {
      if (list.length === 0) return '';
      return `
        <div style="margin-bottom: 24px;">
          <h3 style="color: ${titleColor}; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #e5e5e7; padding-bottom: 6px;">
            ${title} (${list.length})
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${list
                .map(
                  m => `
                <tr style="border-bottom: 1px solid #f5f5f7;">
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 500; color: #1d1d1f;">
                    ${escapeHtml(m.alias)}
                  </td>
                  <td style="padding: 8px 0; font-size: 14px; text-align: right; color: #86868b;">
                    ${escapeHtml(m.country)}
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${escapeHtml(subject)}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: Arial, sans-serif;">
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <h1 style="color: #333; border-bottom: 2px solid #000; padding-bottom: 10px;">
              Selección Finalizada
            </h1>

            <p style="font-size: 15px; line-height: 1.6; color: #333;">
              Hola scouting,
            </p>
            ${totalApproved > 0 ? `
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              El cliente ha finalizado la sesión de selección de talentos para su proyecto. A continuación encuentras la lista de modelos confirmados:
            </p>
            ` : `
            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              El proyecto ha finalizado pero no hubieron modelos aprobados. Por favor, contacta al cliente para dar seguimiento.
            </p>
            `}

            <!-- Project Details -->
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Proyecto</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(projectName)}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Cliente</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(clientName || '—')}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Hora</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Total Aprobados</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; font-size: 16px;">
                  ${totalApproved > 0 ? totalApproved : '0 (Ninguno)'}
                </td>
              </tr>
            </table>

            <!-- Model lists -->
            ${totalApproved > 0 ? `
              ${renderModelTable('Hombres', men, '#333')}
              ${renderModelTable('Mujeres', women, '#333')}
              ${renderModelTable('Otros', other, '#333')}
            ` : ''}
            
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
              Este correo fue enviado automáticamente al finalizar la selección de cliente.
            </p>

          </div>
        </body>
      </html>
    `;

    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: SCOUTING_EMAIL,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Error sending project completion email via Resend:', error);
      return false;
    }

    console.log(`📧 Project completion email successfully sent to ${SCOUTING_EMAIL} for project "${projectName}". ID: ${emailData?.id}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to process project completion email sending:', error);
    return false;
  }
}

export async function sendProjectCompletionEmailByProjectId(projectId: string): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/admin');

    // 1. Obtener detalles del proyecto
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('project_name, client_name, public_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error(`❌ Error fetching project ${projectId} for completion email:`, projectError);
      return false;
    }

    // 2. Obtener modelos aprobados
    const { data: approvedData, error: approvedError } = await supabaseAdmin
      .from('projects_models')
      .select(`
        models:fk_projects_models_model (
          alias,
          full_name,
          gender,
          country,
          birth_country
        )
      `)
      .eq('project_id', projectId)
      .eq('client_selection', 'approved');

    if (approvedError) {
      console.error(`❌ Error fetching approved models for project ${projectId}:`, approvedError);
      return false;
    }

    const approvedModels = (approvedData || [])
      .map((item: any) => {
        const m = item.models;
        if (!m) return null;
        return {
          alias: m.alias || m.full_name || 'Sin Alias',
          fullName: m.full_name || m.alias || 'Sin Nombre',
          gender: m.gender || 'Unknown',
          country: m.country || m.birth_country || 'Sin Nacionalidad',
        };
      })
      .filter((m): m is Exclude<typeof m, null> => m !== null);

    return await sendProjectCompletionEmail({
      projectName: project.project_name || 'Proyecto',
      clientName: project.client_name || 'Cliente',
      publicId: project.public_id || projectId,
      approvedModels,
    });
  } catch (error) {
    console.error(`❌ Exception in sendProjectCompletionEmailByProjectId for project ${projectId}:`, error);
    return false;
  }
}

