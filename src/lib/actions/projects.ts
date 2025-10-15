'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { projectFormSchema } from '../schemas/projects';

// Se define un tipo para el estado del formulario que será consistente
type FormState = {
  error: string | null;
  success: boolean;
};

// CORRECCIÓN: La función ahora acepta 'prevState' como primer argumento,
// como lo requiere el hook useActionState. También se asegura de devolver
// el mismo tipo de estado (FormState).
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
    console.error('Validation Error:', validation.error.flatten().fieldErrors);
    return { success: false, error: 'Los datos enviados no son válidos.' };
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
  
  // En caso de éxito, redirigimos al usuario a la página del nuevo proyecto.
  // El formulario no necesita un estado de "éxito" porque la navegación lo confirma.
  redirect(`/dashboard/projects/${newProject.id}`);
}

