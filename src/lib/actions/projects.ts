'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { projectFormSchema } from '../schemas/projects';
import { z } from 'zod';

// Se define un tipo para el estado del formulario que será consistente
type FormState = {
  error: string | null;
  success: boolean;
};

// La función ahora acepta 'prevState' como primer argumento,
// como lo requiere el hook useActionState.
export async function createProject(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'No se pudo autenticar al usuario.' };
  }

  const rawData = Object.fromEntries(formData.entries());
  const validation = projectFormSchema.safeParse(rawData);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errorMessage = Object.values(fieldErrors).flat().join('. ');
    console.error('Validation Error:', fieldErrors);
    
    // Devolvemos el mensaje de error Y los datos que el usuario envió
    return { success: false, error: errorMessage || 'Los datos enviados no son válidos.', data: rawData };
  }
  
  const { password, ...projectData } = validation.data;

  const dataToInsert = {
    ...projectData,
    password: password || null, // Guarda null si la contraseña está vacía
    user_id: user.id,
  };

  const { data: newProject, error } = await supabase
    .from('projects')
    .insert(dataToInsert)
    .select('id')
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    return { success: false, error: 'Error de base de datos al crear el proyecto.' };
  }

  revalidatePath('/dashboard/projects');
  
  redirect(`/dashboard/projects/${newProject.id}`);
}

/**
 * Elimina un proyecto de la base de datos.
 * @param projectId - El ID del proyecto a eliminar.
 * @returns Un objeto indicando el éxito o el error de la operación.
 */
export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  
  // Validación básica para asegurar que es un UUID
  if (!z.string().uuid().safeParse(projectId).success) {
     return { success: false, error: 'ID de proyecto inválido.' };
  }

  // Eliminar el proyecto
  const { error } = await supabase.from('projects').delete().eq('id', projectId);

  if (error) {
    console.error('Supabase delete error:', error);
    return { success: false, error: 'Error de base de datos al eliminar el proyecto.' };
  }

  // Revalidamos la ruta principal de proyectos para que la lista se actualice
  revalidatePath('/dashboard/projects');
  return { success: true };
}

