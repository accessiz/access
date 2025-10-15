'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { projectFormSchema } from '../schemas/projects';

// ✅ CORRECCIÓN: Se añade el parámetro 'prevState' que espera el hook useFormState.
// Este es el cambio clave que soluciona el error de TypeScript.
export async function createProject(
  prevState: { error: string | null; success: boolean }, 
  formData: FormData
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Es importante retornar un objeto compatible con el estado del formulario.
    return { success: false, error: 'No se pudo autenticar al usuario.' };
  }

  const rawData = Object.fromEntries(formData.entries());
  const validation = projectFormSchema.safeParse(rawData);

  if (!validation.success) {
    console.error('Validation Error:', validation.error.flatten().fieldErrors);
    return { success: false, error: 'Los datos enviados no son válidos. Revisa el nombre del proyecto.' };
  }
  
  const { password, ...projectData } = validation.data;

  const dataToInsert = {
    ...projectData,
    password: password || null, 
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
  
  // La redirección se maneja correctamente al final de una server action exitosa.
  redirect(`/dashboard/projects/${newProject.id}`);

  // Aunque la redirección ocurre antes, TypeScript necesita que la función retorne algo.
  // Este retorno nunca se alcanzará en caso de éxito debido al redirect.
  // return { success: true, error: null };
}
