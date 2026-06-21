'use server'

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logError } from '@/lib/utils/errors';
import { signCookie, getCookieSecret, verifyCookie } from '@/lib/utils/cookie-signature';
import { logActivity } from '@/lib/activity-logger';
import { cleanAndNormalizePhone } from '@/lib/utils/phone';

// Helper to get Guatemala timestamp for activity logs
const getGuatemalaISOString = () => {
  const date = new Date();
  // shift time to GMT-6
  const localTime = date.getTime() - (6 * 60 * 60 * 1000);
  return new Date(localTime).toISOString();
};

/**
 * Validates model credentials and sets a signed session cookie.
 */
export async function loginModelByPhone(phone: string, password_plain: string) {
  if (!phone || !password_plain) {
    return { success: false, error: 'teléfono y contraseña son obligatorios.' };
  }

  const normalizedPhone = cleanAndNormalizePhone(phone);
  if (!normalizedPhone) {
    return { success: false, error: 'el número de teléfono no es válido.' };
  }

  try {
    // Query directly bypassing RLS since models are not auth users
    const { data: model, error } = await supabaseAdmin
      .from('models')
      .select('id, phone_e164, login_password, full_name')
      .eq('phone_e164', normalizedPhone)
      .maybeSingle();

    if (error || !model) {
      if (error) logError(error, { action: 'loginModelByPhone.fetch', phone: normalizedPhone });
      return { success: false, error: 'número de teléfono o contraseña incorrectos.' };
    }

    if (!model.login_password || model.login_password !== password_plain) {
      return { success: false, error: 'número de teléfono o contraseña incorrectos.' };
    }

    // Set signed cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'model_session',
      value: signCookie(model.id, getCookieSecret()),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    return { success: true, modelId: model.id };
  } catch (err) {
    logError(err, { action: 'loginModelByPhone.catch_all', phone: normalizedPhone });
    return { success: false, error: 'error inesperado al iniciar sesión.' };
  }
}

/**
 * Logs out the model by clearing the session cookie.
 */
export async function logoutModel() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('model_session');
    return { success: true };
  } catch (err) {
    logError(err, { action: 'logoutModel' });
    return { success: false, error: 'error al cerrar sesión.' };
  }
}

/**
 * Retrieves the currently logged-in model's details.
 */
export async function getLoggedInModel() {
  try {
    const cookieStore = await cookies();
    const rawCookieValue = cookieStore.get('model_session')?.value;
    if (!rawCookieValue) return null;

    const secret = getCookieSecret();
    if (!verifyCookie(rawCookieValue, secret)) {
      return null;
    }

    const idx = rawCookieValue.lastIndexOf('.');
    if (idx === -1) return null;
    const modelId = rawCookieValue.slice(0, idx);

    if (!z.string().uuid().safeParse(modelId).success) {
      return null;
    }

    const { data: model, error } = await supabaseAdmin
      .from('models')
      .select('*')
      .eq('id', modelId)
      .maybeSingle();

    if (error || !model) return null;
    return model;
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      (('digest' in err && err.digest === 'DYNAMIC_SERVER_USAGE') ||
       ('name' in err && (err.name === 'DynamicServerError' || err.name === 'PrerenderError')) ||
       ('message' in err && typeof err.message === 'string' && (
         err.message.includes('DynamicServerError') || 
         err.message.includes('bailout') || 
         err.message.includes('prerender') ||
         err.message.includes('cookies()')
       )))
    ) {
      throw err;
    }
    logError(err, { action: 'getLoggedInModel' });
    return null;
  }
}

/**
 * Logs that the model opened the project link for the first time.
 */
export async function logModelOpenedLink(projectId: string, modelId: string) {
  try {
    // 1. Fetch project owner user_id and names
    const [{ data: project }, { data: model }] = await Promise.all([
      supabaseAdmin.from('projects').select('user_id, project_name').eq('id', projectId).single(),
      supabaseAdmin.from('models').select('alias, full_name, gender').eq('id', modelId).single(),
    ]);

    if (!project || !model) return { success: false };

    // 2. Check if we already have one or more logs in activity_logs to avoid duplicate spam
    const { data: existingLogs } = await supabaseAdmin
      .from('activity_logs')
      .select('id, created_at')
      .eq('user_id', project.user_id)
      .eq('metadata->>project_id', projectId)
      .eq('metadata->>entity_id', modelId)
      .eq('metadata->>action', 'opened_link')
      .order('created_at', { ascending: true });

    if (existingLogs && existingLogs.length > 0) {
      // Clean up duplicates if they exist in the database (keeping only the oldest one)
      if (existingLogs.length > 1) {
        const idsToDelete = existingLogs.slice(1).map(log => log.id);
        await supabaseAdmin
          .from('activity_logs')
          .delete()
          .in('id', idsToDelete);
      }

      // Update last_opened_at to keep it fresh
      await supabaseAdmin
        .from('projects_models')
        .update({ last_opened_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('model_id', modelId);

      return { success: true };
    }

    // 3. Try to set last_opened_at with concurrency lock if it's the first time, otherwise just update it
    const { data: relation } = await supabaseAdmin
      .from('projects_models')
      .select('last_opened_at')
      .eq('project_id', projectId)
      .eq('model_id', modelId)
      .maybeSingle();

    if (relation && relation.last_opened_at === null) {
      const { data: firstTimeUpdated, error: updateError } = await supabaseAdmin
        .from('projects_models')
        .update({ last_opened_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('model_id', modelId)
        .is('last_opened_at', null)
        .select('model_id');

      if (updateError) {
        logError(updateError, { action: 'logModelOpenedLink.firstTimeUpdate', projectId, modelId });
      }

      const isFirstTime = firstTimeUpdated && firstTimeUpdated.length > 0;
      if (!isFirstTime) {
        // Parallel request already handled the logging, return early
        return { success: true };
      }
    } else {
      // It was opened before but the activity log is missing, so we just update the timestamp and proceed to write the log
      await supabaseAdmin
        .from('projects_models')
        .update({ last_opened_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('model_id', modelId);
    }

    // 4. Insert log under the project owner's account
    const { error: insertError } = await supabaseAdmin.from('activity_logs').insert({
      user_id: project.user_id,
      category: 'talent',
      title: `${model.alias || model.full_name} abrió el enlace del proyecto "${project.project_name}"`,
      message: `${model.alias || model.full_name} visualizó la propuesta de trabajo.`,
      metadata: {
        entity_id: modelId,
        entity_type: 'model',
        project_id: projectId,
        action: 'opened_link',
        model_alias: model.alias || model.full_name,
        model_gender: model.gender,
      },
    });

    if (insertError) {
      if (insertError.code === '23505') {
        // Parallel request already handled the logging, return early
        return { success: true };
      }
      logError(insertError, { action: 'logModelOpenedLink.insertLog', projectId, modelId });
    }

    return { success: true };
  } catch (err) {
    logError(err, { action: 'logModelOpenedLink', projectId, modelId });
    return { success: false };
  }
}

/**
 * Submits the model's response to a project.
 */
export async function applyToProject(
  projectId: string,
  modelId: string,
  accept: boolean,
  selectedSchedules: string[]
) {
  if (!z.string().uuid().safeParse(projectId).success || !z.string().uuid().safeParse(modelId).success) {
    return { success: false, error: 'ids de proyecto o modelo inválidos.' };
  }

  try {
    // 1. Fetch project and model info
    const [{ data: project }, { data: model }] = await Promise.all([
      supabaseAdmin.from('projects').select('*').eq('id', projectId).single(),
      supabaseAdmin.from('models').select('alias, full_name').eq('id', modelId).single(),
    ]);

    if (!project || !model) {
      return { success: false, error: 'proyecto o talento no encontrado.' };
    }

    // Check application deadline
    if (project.apply_end_at && new Date() > new Date(project.apply_end_at)) {
      return { success: false, error: 'este proyecto ya cerró. ya no puedes aplicar.' };
    }

    const modelStatus = accept ? 'applied' : 'rejected';
    const schedulesArray = accept ? selectedSchedules : null;

    // 2. Check if relation already exists
    const { data: existingRelation } = await supabaseAdmin
      .from('projects_models')
      .select('*')
      .eq('project_id', projectId)
      .eq('model_id', modelId)
      .maybeSingle();

    if (existingRelation) {
      // Update existing
      const { error: updateError } = await supabaseAdmin
        .from('projects_models')
        .update({
          model_status: modelStatus,
          model_available_schedules: schedulesArray,
          client_selection: 'pending', // Reset selection status if applying/re-applying
        })
        .eq('project_id', projectId)
        .eq('model_id', modelId);

      if (updateError) {
        logError(updateError, { action: 'applyToProject.updateRelation', projectId, modelId });
        return { success: false, error: 'error al actualizar tu postulación.' };
      }
    } else {
      // Insert new
      const { error: insertError } = await supabaseAdmin
        .from('projects_models')
        .insert({
          project_id: projectId,
          model_id: modelId,
          model_status: modelStatus,
          model_available_schedules: schedulesArray,
          client_selection: 'pending',
          agreed_fee: project.default_model_fee || 0,
          fee_type: project.default_fee_type || 'per_day',
          currency: project.currency || 'GTQ',
          trade_fee: project.default_model_trade_fee || 0,
        });

      if (insertError) {
        logError(insertError, { action: 'applyToProject.insertRelation', projectId, modelId });
        return { success: false, error: 'error al registrar tu postulación.' };
      }
    }

    // 3. Update model assignments (admin-facing final assignments)
    // First, delete any existing assignments for this model in this project
    // Fetch all schedules for this project to delete assignments and for detailed logging
    const { data: projectSchedules } = await supabaseAdmin
      .from('project_schedule')
      .select('id, start_time')
      .eq('project_id', projectId);

    const scheduleIds = projectSchedules?.map(s => s.id) || [];

    if (scheduleIds.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('model_assignments')
        .delete()
        .eq('model_id', modelId)
        .in('schedule_id', scheduleIds);

      if (deleteError) {
        logError(deleteError, { action: 'applyToProject.deleteAssignments', projectId, modelId });
      }

      // If they accepted, insert new assignments representing their initial availability
      if (accept && selectedSchedules.length > 0) {
        const assignmentsToInsert = selectedSchedules.map(scheduleId => ({
          schedule_id: scheduleId,
          model_id: modelId,
          project_id: projectId,
          payment_type: project.default_model_payment_type || 'cash',
          trade_category: project.default_model_trade_category || null,
          trade_details: project.default_model_trade_details || null,
          trade_fee: project.default_model_trade_fee || null,
          daily_fee: project.default_model_fee || null,
          payment_status: 'pending',
        }));

        const { error: insertAssignmentsError } = await supabaseAdmin
          .from('model_assignments')
          .insert(assignmentsToInsert);

        if (insertAssignmentsError) {
          logError(insertAssignmentsError, { action: 'applyToProject.insertAssignments', projectId, modelId });
        }
      }
    }

    // 4. Log activity
    const displayName = model.alias || model.full_name;
    const title = accept
      ? `${displayName} aceptó aplicar al proyecto "${project.project_name}"`
      : `${displayName} rechazó el trabajo del proyecto "${project.project_name}"`;

    // Formateador de fechas breves en español (ej. "7 jun")
    const formatBriefSpanishDate = (isoString: string) => {
      try {
        const d = new Date(isoString);
        return d.toLocaleDateString('es-ES', {
          timeZone: 'America/Guatemala',
          day: 'numeric',
          month: 'short',
        }).replace('.', ''); // Quitar posibles puntos
      } catch (e) {
        return isoString;
      }
    };

    let datesDetail = '';
    if (accept) {
      const scheduleMap = new Map((projectSchedules || []).map(s => [s.id, s.start_time]));
      const selectedDatesTexts = selectedSchedules
        .map(id => scheduleMap.get(id))
        .filter(Boolean)
        .map(time => formatBriefSpanishDate(time!));

      const totalSchedulesCount = projectSchedules?.length || 0;
      const acceptedCount = selectedSchedules.length;

      if (acceptedCount === 0) {
        datesDetail = 'ningún día';
      } else if (acceptedCount === totalSchedulesCount && totalSchedulesCount > 1) {
        datesDetail = 'todos los días';
      } else if (acceptedCount === 1) {
        datesDetail = `el día ${selectedDatesTexts[0]}`;
      } else {
        datesDetail = `los días: ${selectedDatesTexts.join(', ')}`;
      }
    }

    const message = accept
      ? `${displayName} marcó disponibilidad para ${datesDetail} y envió su respuesta.`
      : `${displayName} marcó que no puede participar.`;

    // Delete any existing response logs (applied or declined) for this model/project
    // to ensure only the latest response is kept in the activity log
    await supabaseAdmin
      .from('activity_logs')
      .delete()
      .eq('user_id', project.user_id)
      .eq('metadata->>project_id', projectId)
      .eq('metadata->>entity_id', modelId)
      .or('metadata->>action.eq.applied,metadata->>action.eq.declined');

    const { error: insertError } = await supabaseAdmin.from('activity_logs').insert({
      user_id: project.user_id,
      category: 'talent',
      title,
      message,
      metadata: {
        entity_id: modelId,
        entity_type: 'model',
        project_id: projectId,
        action: accept ? 'applied' : 'declined',
        available_schedules_count: selectedSchedules.length,
      },
    });

    if (insertError) {
      if (insertError.code === '23505') {
        // Parallel request already handled the logging, return early
        return { success: true };
      }
      logError(insertError, { action: 'applyToProject.insertLog', projectId, modelId });
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath(`/m/${project.public_id}`);

    return { success: true };
  } catch (err) {
    logError(err, { action: 'applyToProject.catch_all', projectId, modelId });
    return { success: false, error: 'error inesperado al enviar respuesta.' };
  }
}

/**
 * Updates the model's social media details in their profile.
 */
export async function updateModelSocials(modelId: string, instagram: string, tiktok: string) {
  if (!z.string().uuid().safeParse(modelId).success) {
    return { success: false, error: 'id de talento inválido.' };
  }

  try {
    const { error } = await supabaseAdmin
      .from('models')
      .update({
        instagram: instagram ? instagram.trim() : null,
        tiktok: tiktok ? tiktok.trim() : null,
      })
      .eq('id', modelId);

    if (error) {
      logError(error, { action: 'updateModelSocials', modelId });
      return { success: false, error: 'error al actualizar redes sociales.' };
    }

    return { success: true };
  } catch (err) {
    logError(err, { action: 'updateModelSocials.catch_all', modelId });
    return { success: false, error: 'error inesperado al actualizar redes sociales.' };
  }
}

/**
 * Fetches the list of projects the model has applied to, along with their schedules,
 * assignments, client selection, and computed payment status.
 */
export async function getAppliedProjectsForModel(modelId: string) {
  if (!z.string().uuid().safeParse(modelId).success) {
    return [];
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('projects_models')
      .select(`
        *,
        projects!projects_models_project_id_fkey (
          *,
          project_schedule (*)
        )
      `)
      .eq('model_id', modelId);

    if (error || !data) {
      if (error) logError(error, { action: 'getAppliedProjectsForModel', modelId });
      return [];
    }

    // Collect all schedule IDs to batch query assignments
    const scheduleIds: string[] = [];
    data.forEach((item: any) => {
      const schedules = item.projects?.project_schedule || [];
      schedules.forEach((s: any) => {
        if (s.id) scheduleIds.push(s.id);
      });
    });

    let assignments: any[] = [];
    if (scheduleIds.length > 0) {
      const { data: assignmentsData } = await supabaseAdmin
        .from('model_assignments')
        .select('*')
        .eq('model_id', modelId)
        .in('schedule_id', scheduleIds);
      assignments = assignmentsData || [];
    }

    const result = data
      .filter((item: any) => !!item.projects)
      .map((item: any) => {
        const project = item.projects;
        const schedules = project.project_schedule || [];
        const projectAssignments = assignments.filter((a) =>
          schedules.some((s: any) => s.id === a.schedule_id)
        );

        // Paid status logic:
        // If approved, verify if all assignments are marked as paid
        let isPaid = false;
        const hasAssignments = projectAssignments.length > 0;
        if (item.client_selection === 'approved') {
          if (hasAssignments) {
            isPaid = projectAssignments.every((a) => a.payment_status === 'paid');
          } else {
            isPaid = false;
          }
        }

        return {
          project_id: project.id,
          public_id: project.public_id,
          project_name: project.project_name,
          client_name: project.client_name,
          location: project.location,
          description: project.description,
          currency: item.currency,
          agreed_fee: item.agreed_fee,
          trade_fee: item.trade_fee,
          fee_type: item.fee_type,
          client_selection: item.client_selection,
          model_status: item.model_status,
          model_available_schedules: item.model_available_schedules,
          application_deadline: project.application_deadline,
          apply_end_at: project.apply_end_at,
          apply_start_at: project.apply_start_at,
          created_at: project.created_at,
          schedule: schedules.map((s: any) => ({
            id: s.id,
            date: s.start_time.split('T')[0],
            startTime: s.start_time,
            endTime: s.end_time,
            location: s.location,
          })),
          assignments: projectAssignments,
          isPaid,
        };
      });

    return result;
  } catch (err) {
    logError(err, { action: 'getAppliedProjectsForModel', modelId });
    return [];
  }
}

/**
 * Checks if a model exists by phone and if they already have a password set.
 */
export async function checkModelPhone(phone: string) {
  if (!phone) {
    return { success: false, error: 'el número de teléfono es obligatorio.' };
  }

  const normalizedPhone = cleanAndNormalizePhone(phone);
  if (!normalizedPhone) {
    return { success: false, error: 'el número de teléfono no es válido.' };
  }

  try {
    const { data: model, error } = await supabaseAdmin
      .from('models')
      .select('id, phone_e164, login_password')
      .eq('phone_e164', normalizedPhone)
      .maybeSingle();

    if (error) {
      logError(error, { action: 'checkModelPhone.fetch', phone: normalizedPhone });
      return { success: false, error: 'error al verificar el teléfono.' };
    }

    if (!model) {
      return { success: false, error: 'este número de teléfono no está registrado en el portal. contacta al administrador.' };
    }

    return { success: true, hasPassword: !!model.login_password, modelId: model.id, phone: model.phone_e164 };
  } catch (err) {
    logError(err, { action: 'checkModelPhone.catch_all', phone: normalizedPhone });
    return { success: false, error: 'error inesperado al verificar el teléfono.' };
  }
}

/**
 * Registers a new password for a model (first-time login) and sets the session cookie.
 */
export async function registerModelPasswordByPhone(phone: string, password_plain: string) {
  if (!phone || !password_plain) {
    return { success: false, error: 'el teléfono y la contraseña son obligatorios.' };
  }

  if (password_plain.length < 6) {
    return { success: false, error: 'la contraseña debe tener al menos 6 caracteres.' };
  }

  const normalizedPhone = cleanAndNormalizePhone(phone);
  if (!normalizedPhone) {
    return { success: false, error: 'el número de teléfono no es válido.' };
  }

  try {
    // 1. Fetch model to check if they already have a password
    const { data: model, error } = await supabaseAdmin
      .from('models')
      .select('id, phone_e164, login_password')
      .eq('phone_e164', normalizedPhone)
      .maybeSingle();

    if (error || !model) {
      if (error) logError(error, { action: 'registerModelPasswordByPhone.fetch', phone: normalizedPhone });
      return { success: false, error: 'talento no encontrado.' };
    }

    if (model.login_password) {
      return { success: false, error: 'este talento ya tiene una contraseña registrada. por favor inicia sesión.' };
    }

    // 2. Update password
    const { error: updateError } = await supabaseAdmin
      .from('models')
      .update({ login_password: password_plain })
      .eq('id', model.id);

    if (updateError) {
      logError(updateError, { action: 'registerModelPasswordByPhone.update', modelId: model.id });
      return { success: false, error: 'no se pudo registrar la contraseña.' };
    }

    // 3. Set signed session cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'model_session',
      value: signCookie(model.id, getCookieSecret()),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    return { success: true, modelId: model.id };
  } catch (err) {
    logError(err, { action: 'registerModelPasswordByPhone.catch_all', phone: normalizedPhone });
    return { success: false, error: 'error inesperado al registrar la contraseña.' };
  }
}

/**
 * Updates the model's profile details (email, phone, socials) from their profile view.
 */
export async function updateModelProfile(
  modelId: string,
  email: string,
  phone: string,
  instagram: string,
  tiktok: string
) {
  if (!z.string().uuid().safeParse(modelId).success) {
    return { success: false, error: 'id de talento inválido.' };
  }

  const normalizedPhone = cleanAndNormalizePhone(phone);
  if (phone && !normalizedPhone) {
    return { success: false, error: 'El número de teléfono no es válido. Debe incluir el código de país (ej. +502).' };
  }

  const trimmedEmail = email ? email.toLowerCase().trim() : null;

  try {
    // Validate unique email constraint if email is modified
    if (trimmedEmail) {
      const { data: dupEmail } = await supabaseAdmin
        .from('models')
        .select('id')
        .eq('email', trimmedEmail)
        .neq('id', modelId)
        .maybeSingle();

      if (dupEmail) {
        return { success: false, error: 'Este correo electrónico ya está en uso por otro talento.' };
      }
    }

    // Validate unique phone constraint if phone is modified
    if (normalizedPhone) {
      const { data: dupPhone } = await supabaseAdmin
        .from('models')
        .select('id')
        .eq('phone_e164', normalizedPhone)
        .neq('id', modelId)
        .maybeSingle();

      if (dupPhone) {
        return { success: false, error: 'Este número de teléfono ya está en uso por otro talento.' };
      }
    }

    const { error } = await supabaseAdmin
      .from('models')
      .update({
        email: trimmedEmail,
        phone_e164: normalizedPhone,
        instagram: instagram ? instagram.trim() : null,
        tiktok: tiktok ? tiktok.trim() : null,
      })
      .eq('id', modelId);

    if (error) {
      logError(error, { action: 'updateModelProfile', modelId });
      return { success: false, error: 'error al actualizar el perfil.' };
    }

    revalidatePath('/dashboard/models');
    revalidatePath(`/dashboard/models/${modelId}`);
    return { success: true };
  } catch (err) {
    logError(err, { action: 'updateModelProfile.catch_all', modelId });
    return { success: false, error: 'error inesperado al actualizar el perfil.' };
  }
}

