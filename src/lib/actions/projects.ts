'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'

import { logError } from '@/lib/utils/errors'
import type { ProjectStatus } from '@/lib/types'
import { projectFormSchema } from '@/lib/schemas/projects'

type ActionState = { success: boolean; error?: string; errors?: Record<string, string>; projectId?: string; };

const createSupabaseServerActionClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )
}

export async function createProject(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerActionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' };
  }

  // Manually construct the data object for validation
  const scheduleEntries = Array.from(formData.keys())
    .filter(key => key.startsWith('schedule.'))
    .reduce((acc, key) => {
      const match = key.match(/schedule\.(\d+)\.(date|startTime|endTime)/);
      if (match) {
        const index = parseInt(match[1], 10);
        const field = match[2];
        if (!acc[index]) acc[index] = {};
        (acc[index] as any)[field] = formData.get(key);
      }
      return acc;
    }, [] as any[]);

  const rawData = {
    project_name: formData.get('project_name'),
    client_name: formData.get('client_name'),
    description: formData.get('description'),
    password: formData.get('password'),
    schedule: scheduleEntries.filter(entry => entry.date || entry.startTime || entry.endTime),
  };

  const parsed = projectFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      success: false,
      error: 'Campos inválidos.',
      errors: Object.fromEntries(
        Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0] ?? ''])
      ) as Record<string, string>,
    };
  }
  
  const { password, ...restOfData } = parsed.data;

  try {
    const normalizedPassword = password ? password : null;
    const schedule = (parsed.data.schedule && parsed.data.schedule.length > 0) ? parsed.data.schedule : null;

    const insertPayload = {
      ...restOfData,
      password: normalizedPassword,
      schedule,
      status: 'draft' as const,
      user_id: user.id,
    };

    const { data: newProject, error } = await supabase
      .from('projects')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) {
      logError(error, { action: 'createProject' });
      return { success: false, error: 'Error en la base de datos.' };
    }

    revalidatePath('/dashboard/projects');
    return { success: true, projectId: newProject.id };

  } catch (err) {
    logError(err, { action: 'createProject.catch_all' });
    return { success: false, error: 'Error inesperado al crear el proyecto.' };
  }
}


export async function deleteProject(id: string) {
  const supabase = await createSupabaseServerActionClient()

  try {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/dashboard/projects')
    return { success: true }
  } catch (err) {
    logError(err, { action: 'deleteProject', projectId: id })
    return { success: false, error: 'No se pudo eliminar el proyecto.' }
  }
}

export async function completeProjectReview(projectId: string) {
  const supabase = await createSupabaseServerActionClient()

  const statusToSet: ProjectStatus = 'completed'
  const completionDate = new Date().toISOString().slice(0, 10)

  try {
    const { error } = await supabase
      .from('projects')
      .update({
        status: statusToSet,
      })
      .eq('id', projectId)

    if (error) {
      logError(error, { action: 'completeProjectReview', projectId })
      return {
        success: false,
        error: 'No se pudo actualizar el estado del proyecto.',
      }
    }

    try {
      const { data: projRow } = await supabase
        .from('projects')
        .select('public_id')
        .eq('id', projectId)
        .single()
      if (projRow?.public_id) {
        revalidatePath(`/c/${projRow.public_id}`)
      }
    } catch {}
    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
  } catch (err) {
    logError(err, { action: 'completeProjectReview.catch_all', projectId })
    return { success: false, error: 'Error inesperado al completar la revisión.' }
  }
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
) {
  const supabase = await createSupabaseServerActionClient()

  try {
    const { data: projRow, error: fetchErr } = await supabase
      .from('projects')
      .select('public_id')
      .eq('id', projectId)
      .single()

    if (fetchErr) {
      logError(fetchErr, { action: 'updateProjectStatus.fetch_public_id', projectId, status })
    }

    const updatePayload: Record<string, unknown> = { status }
    
    const { error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId)

    if (error) {
      logError(error, { action: 'updateProjectStatus', projectId, status })
      return { success: false, error: 'No se pudo actualizar el estado del proyecto.' }
    }

    if (projRow?.public_id) {
      revalidatePath(`/c/${projRow.public_id}`)
    }
    revalidatePath(`/dashboard/projects/${projectId}`)
    revalidatePath('/dashboard/projects')
    return { success: true }
  } catch (err) {
    logError(err, { action: 'updateProjectStatus.catch_all', projectId, status })
    return { success: false, error: 'Error inesperado al actualizar el estado.' }
  }
}

export async function verifyProjectPassword(projectId: string, password: string) {
  const supabase = await createSupabaseServerActionClient()

  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, password')
      .eq('id', projectId)
      .single()

    if (error || !project) {
      if (error) logError(error, { action: 'verifyProjectPassword.fetch', projectId })
      return { success: false, error: 'Proyecto no encontrado.' }
    }

    if (!project.password) {
      const cookieStore = await cookies()
      cookieStore.set({
        name: `project_access_${projectId}`,
        value: 'true',
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      })
      return { success: true }
    }

    const isValid = project.password === password
    if (!isValid) {
      return { success: false, error: 'Contraseña incorrecta.' }
    }

    const cookieStore = await cookies()
    cookieStore.set({
      name: `project_access_${projectId}`,
      value: 'true',
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return { success: true }
  } catch (err) {
    logError(err, { action: 'verifyProjectPassword.catch_all', projectId })
    return { success: false, error: 'No se pudo verificar la contraseña.' }
  }
}
