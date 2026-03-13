'use server'

import { cookies } from 'next/headers'
// Eliminada importación de compare de bcryptjs


import { logError } from '@/lib/utils/errors'
import { signCookie, getCookieSecret } from '@/lib/utils/cookie-signature'
import { createSupabaseServerActionClient } from '@/lib/supabase/server-action'

// ─────────────────────────────────────────────
// verifyProjectPassword
// ─────────────────────────────────────────────

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
        value: signCookie(projectId, getCookieSecret()),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      })
      return { success: true }
    }

    const isValid = password === project.password;
    if (!isValid) {
      return { success: false, error: 'Contraseña incorrecta.' }
    }

    const cookieStore = await cookies()
    cookieStore.set({
      name: `project_access_${projectId}`,
      value: signCookie(projectId, getCookieSecret()),
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
