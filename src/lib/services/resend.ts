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

    const siteUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const approvedPageUrl = `${siteUrl.replace(/\/$/, '')}/c/${publicId}/approved`;

    const subject = `✅ ${totalApproved} Modelos Aprobados — ${projectName} (${clientName || 'Cliente'})`;

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
        <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 30px auto; background-color: #ffffff; border: 1px solid #e5e5e7; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
            
            <!-- Header Banner (High Fashion aesthetic) -->
            <div style="background-color: #000000; padding: 32px 24px; text-align: center;">
              <img src="${siteUrl.replace(/\/$/, '')}/images/access-logo_light.svg" alt="IZ ACCESS" style="height: 22px; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none;" />
              <p style="color: #a1a1a6; margin: 12px 0 0 0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">
                Selección Finalizada
              </p>
            </div>

            <!-- Main Content Area -->
            <div style="padding: 32px 24px;">
              
              <!-- Welcome message -->
              <p style="margin-top: 0; font-size: 15px; line-height: 1.6; color: #1d1d1f;">
                Hola scouting,
              </p>
              <p style="font-size: 15px; line-height: 1.6; color: #515154;">
                El cliente ha finalizado la sesión de selección de talentos para su proyecto. A continuación encuentras la lista de modelos confirmados:
              </p>

              <!-- Project Details Summary Box -->
              <div style="background-color: #f5f5f7; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h2 style="margin-top: 0; font-size: 15px; font-weight: 600; color: #1d1d1f; border-bottom: 1px solid #d2d2d7; padding-bottom: 8px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Detalle del Proyecto
                </h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #515154;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #1d1d1f;">Proyecto:</td>
                    <td style="padding: 6px 0; color: #1d1d1f; font-weight: 500;">${escapeHtml(projectName)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #1d1d1f;">Cliente:</td>
                    <td style="padding: 6px 0; color: #1d1d1f; font-weight: 500;">${escapeHtml(clientName || '—')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #1d1d1f;">Fecha:</td>
                    <td style="padding: 6px 0; color: #1d1d1f;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #1d1d1f;">Hora:</td>
                    <td style="padding: 6px 0; color: #1d1d1f;">${formattedTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0 0 0; font-weight: bold; color: #1d1d1f; border-top: 1px solid #e5e5e7; margin-top: 8px;">Aprobados:</td>
                    <td style="padding: 8px 0 0 0; font-weight: bold; color: #000000; font-size: 16px; border-top: 1px solid #e5e5e7; margin-top: 8px;">
                      ${totalApproved}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Model lists -->
              ${renderModelTable('Hombres', men, '#1d1d1f')}
              ${renderModelTable('Mujeres', women, '#1d1d1f')}
              ${renderModelTable('Otros', other, '#1d1d1f')}

              <!-- Call to Action Link -->
              <div style="text-align: center; margin: 36px 0 12px 0;">
                <a href="${approvedPageUrl}" 
                   style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 32px; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  VER DETALLE COMPLETO (FOTOS) →
                </a>
              </div>
              
            </div>

            <!-- Footer Message -->
            <div style="background-color: #f5f5f7; border-top: 1px solid #e5e5e7; padding: 20px; text-align: center;">
              <p style="color: #86868b; font-size: 11px; margin: 0; line-height: 1.4;">
                Este correo fue enviado automáticamente al finalizar la selección de cliente en IZ ACCESS.
              </p>
            </div>
            
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

