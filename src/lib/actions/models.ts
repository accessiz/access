'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { modelFormSchema, ModelFormData } from '@/lib/schemas'
import { z } from 'zod'
import { zodErrorToFieldErrors } from '@/lib/utils/zod'
import { logError } from '@/lib/utils/errors';

export async function createModel(data: ModelFormData) {
  // ✅ SOLUCIÓN: Añadimos 'await' al crear el cliente.
  const supabase = await createClient();
  const validation = modelFormSchema.safeParse(data);
  if (!validation.success) {
    logError(validation.error, { action: 'createModel.validation' });
    return { success: false, error: 'Los datos enviados no son válidos.', errors: zodErrorToFieldErrors(validation.error) };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { success: false, error: 'No se pudo autenticar al usuario.' }; }
  const { data: newModel, error } = await supabase
    .from('models')
    .insert({ ...validation.data, user_id: user.id })
    .select('id').single();
  if (error) {
    logError(error, { action: 'createModel.insert' });
    return { success: false, error: 'Error de base de datos al crear el modelo.' };
  }
  revalidatePath('/dashboard/models');
  return { success: true, modelId: newModel.id };
}

export async function updateModel(modelId: string, data: ModelFormData) {
  // ✅ SOLUCIÓN: Añadimos 'await' al crear el cliente.
  const supabase = await createClient()
  const validation = modelFormSchema.safeParse(data);
  if (!validation.success) {
    logError(validation.error, { action: 'updateModel.validation', modelId });
    return { success: false, error: 'Los datos enviados no son válidos.', errors: zodErrorToFieldErrors(validation.error) };
  }
  const { error } = await supabase.from('models').update(validation.data).eq('id', modelId);
  if (error) {
    logError(error, { action: 'updateModel.update', modelId });
    return { success: false, error: 'Error de base de datos al actualizar el modelo.' };
  }
  revalidatePath(`/dashboard/models`);
  revalidatePath(`/dashboard/models/${modelId}`);
  return { success: true };
}

export async function deleteModel(modelId: string) {
  // ✅ SOLUCIÓN: Añadimos 'await' al crear el cliente.
  const supabase = await createClient();
  if (!z.string().uuid().safeParse(modelId).success) {
     return { success: false, error: 'ID de modelo inválido.' };
  }
  const { error } = await supabase.from('models').delete().eq('id', modelId);
  if (error) {
    logError(error, { action: 'deleteModel.delete', modelId });
    return { success: false, error: 'Error de base de datos al eliminar el modelo.' };
  }
  revalidatePath('/dashboard/models');
  return { success: true };
}