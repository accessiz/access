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

  // --- INICIO DE LA CORRECCIÓN ---
  if (!validation.success) {
    // Aplanamos los errores de Zod para acceder a ellos fácilmente.
    const fieldErrors = validation.error.flatten().fieldErrors;
    
    // Unimos todos los mensajes de error en un solo string para mostrarlo.
    const errorMessage = Object.values(fieldErrors).flat().join('. ');

    console.error('Validation Error:', fieldErrors);
    
    // Devolvemos el mensaje de error específico de Zod.
    return { success: false, error: errorMessage || 'Los datos enviados no son válidos.' };
  }
  // --- FIN DE LA CORRECCIÓN ---
  
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

