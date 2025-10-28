'use server'

// --- IMPORTACIONES MODERNAS ---
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// ----------------------------

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
// import { PostgrestError } from '@supabase/supabase-js'
import { projectFormSchema } from '@/lib/schemas/projects'

// --- IMPORTACIONES CON ALIAS ---
import { logError } from '@/lib/utils/errors'
import type { ProjectStatus } from '@/lib/types'

// Estado estándar que devuelven las server actions de proyectos
type ActionState = { success: boolean; error?: string; errors?: Record<string, string> }

// --- FUNCIÓN HELPER (ASÍNCRONA) ---
// La versión corregida para Next.js 15+
const createSupabaseServerActionClient = async () => {
  const cookieStore = await cookies() // Se usa 'await'
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {}
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {}
        },
      },
    }
  )
}

// --- ESQUEMA DE VALIDACIÓN ---
// (Tomado de tu nyxa_dump.md)
const projectSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  // ProjectStatus es un tipo (union de strings), por eso usamos z.enum con los valores explícitos
  status: z.enum(['draft', 'sent', 'in-review', 'completed', 'archived']).default('draft'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  public_id: z.string().uuid(),
  user_id: z.string().uuid(),
})

// --- ACCIÓN: createProject (COMPLETA Y ACTUALIZADA) ---
// Nota: con useActionState, la acción recibe (prevState, formData)
export async function createProject(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerActionClient() // CLIENTE CORREGIDO

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' }
  }

  // Valida los campos que realmente envía el formulario de UI
  const parsed = projectFormSchema.safeParse({
    project_name: formData.get('project_name'),
    client_name: formData.get('client_name') ?? undefined,
    description: formData.get('description') ?? undefined,
    password: formData.get('password') ?? undefined,
  })

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    return {
      success: false,
      error: 'Campos inválidos.',
      // Mapea a un diccionario simple: { campo: 'primer mensaje' }
      errors: Object.fromEntries(
        Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0] ?? ''])
      ) as Record<string, string>,
    }
  }

  try {
    // Normaliza password: cadena vacía -> null (para que sea “sin contraseña”)
    const normalizedPassword = parsed.data.password ? parsed.data.password : null
    const insertPayload = {
      project_name: parsed.data.project_name,
      client_name: parsed.data.client_name ?? null,
      description: parsed.data.description ?? null,
      password: normalizedPassword,
      status: 'draft' as const,
      public_id: crypto.randomUUID(), // Asegúrate de que tu BBDD tenga esto como default
      user_id: user.id,
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      logError(error, { action: 'createProject' })
      return { success: false, error: 'Error en la base de datos.' }
    }

    revalidatePath('/dashboard/projects')
    // NOTA: 'redirect' no funciona bien con useActionState, 
    // la redirección debe manejarse en el cliente (ProjectForm)
    return { success: true } 
  } catch (err) {
    logError(err, { action: 'createProject.catch_all' })
    return { success: false, error: 'Error inesperado al crear el proyecto.' }
  }
}

// --- ACCIÓN: updateProject (COMPLETA Y ACTUALIZADA) ---
export async function updateProject(id: string, formData: FormData) {
  const supabase = await createSupabaseServerActionClient() // CLIENTE CORREGIDO

  const validatedFields = projectSchema.partial().safeParse({
    name: formData.get('name'),
    status: formData.get('status'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Campos inválidos.',
      issues: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .update(validatedFields.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError(error, { action: 'updateProject', projectId: id })
      return { success: false, error: 'Error en la base de datos.' }
    }

    revalidatePath('/dashboard/projects')
    revalidatePath(`/dashboard/projects/${id}`)
    return { success: true, data }
  } catch (err) {
    logError(err, { action: 'updateProject.catch_all', projectId: id })
    return { success: false, error: 'Error inesperado al actualizar el proyecto.' }
  }
}

// --- ACCIÓN: deleteProject (COMPLETA Y ACTUALIZADA) ---
export async function deleteProject(id: string) {
  const supabase = await createSupabaseServerActionClient() // CLIENTE CORREGIDO

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

// --- ACCIÓN: completeProjectReview (COMPLETA Y ACTUALIZADA) ---
export async function completeProjectReview(projectId: string) {
  const supabase = await createSupabaseServerActionClient() // CLIENTE CORREGIDO

  // 1. El estado siempre es 'completed', no importa quién haga clic.
  const statusToSet: ProjectStatus = 'completed'
  // 2. La fecha actual para la columna 'end_date'.
  // Guardar solo la fecha (columna 'date' en la DB)
  const completionDate = new Date().toISOString().slice(0, 10)

  try {
    const { error } = await supabase
      .from('projects')
      .update({
        status: statusToSet,
        end_date: completionDate, // Usa la columna 'end_date'
      })
      .eq('id', projectId)

    if (error) {
      logError(error, { action: 'completeProjectReview', projectId })
      return {
        success: false,
        error: 'No se pudo actualizar el estado del proyecto.',
      }
    }

    // Revalida la ruta pública correcta usando public_id
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

// --- ACCIÓN: updateProjectStatus (para /c y panel) ---
export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
) {
  const supabase = await createSupabaseServerActionClient()

  try {
    // Obtenemos public_id para revalidar la ruta pública correcta
    const { data: projRow, error: fetchErr } = await supabase
      .from('projects')
      .select('public_id')
      .eq('id', projectId)
      .single()

    if (fetchErr) {
      logError(fetchErr, { action: 'updateProjectStatus.fetch_public_id', projectId, status })
      // No abortamos, pero no podremos revalidar /c/<public_id>
    }

    // Solo establecer end_date cuando el estado sea 'completed'
    const updatePayload: Record<string, unknown> = { status }
    if (status === 'completed') {
      updatePayload.end_date = new Date().toISOString().slice(0, 10)
    }

    const { error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId)

    if (error) {
      logError(error, { action: 'updateProjectStatus', projectId, status })
      return { success: false, error: 'No se pudo actualizar el estado del proyecto.' }
    }

    // Revalidaciones útiles
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

// --- ACCIÓN: verifyProjectPassword (para acceso público en /c) ---
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
      // Proyecto sin contraseña: conceder acceso por cookie igualmente para evitar re-prompt
      const cookieStore = await cookies()
      cookieStore.set({
        name: `project_access_${projectId}`,
        value: 'true',
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
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
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })

    return { success: true }
  } catch (err) {
    logError(err, { action: 'verifyProjectPassword.catch_all', projectId })
    return { success: false, error: 'No se pudo verificar la contraseña.' }
  }
}