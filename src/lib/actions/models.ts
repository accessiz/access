'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { modelFormSchema, ModelFormData } from '@/lib/schemas'
import { z } from 'zod'
import { zodErrorToFieldErrors } from '@/lib/utils/zod'
import { logError } from '@/lib/utils/errors';
import { PostgrestError } from '@supabase/supabase-js';

// Helper function to check for Supabase errors
const isPostgrestError = (error: unknown): error is PostgrestError => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

// Helper function to map common Supabase errors to user-friendly messages
const mapDbError = (error: PostgrestError): { message: string; fieldErrors?: Record<string, string> } => {
  // Unique constraint violation
  if (error.code === '23505') {
    // Check details for the specific constraint if available
    if (error.details?.includes('models_email_key')) {
      return { message: 'Este correo electrónico ya está registrado.', fieldErrors: { email: 'Este correo ya está en uso.' } };
    }
    if (error.details?.includes('models_national_id_key')) {
      return { message: 'Este Documento ID ya está registrado.', fieldErrors: { national_id: 'Este ID ya está en uso.' } };
    }
    if (error.details?.includes('models_phone_e164_key')) {
      return { message: 'Este número de teléfono ya está registrado.', fieldErrors: { phone_e164: 'Este teléfono ya está en uso.' } };
    }
    return { message: 'Se encontró un conflicto de datos únicos (ej. email o ID duplicado).' };
  }
  // Default fallback
  return { message: 'Ocurrió un error inesperado en la base de datos.' };
};

// --- createModel function ---
export async function createModel(data: ModelFormData) {
  const supabase = await createClient(); //

  // 1. Validate input data with Zod
  const validation = modelFormSchema.safeParse(data); //
  if (!validation.success) {
    logError(validation.error, { action: 'createModel.validation' }); //
    return { success: false, error: 'Los datos enviados no son válidos.', errors: zodErrorToFieldErrors(validation.error) }; //
  }

  // 2. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser(); //
  if (!user) { return { success: false, error: 'No se pudo autenticar al usuario.' }; } //

  // 3. Try inserting into the database
  try {
    const { data: newModel, error } = await supabase
      .from('models')
      .insert({ ...validation.data, user_id: user.id }) //
      .select('id').single(); //

    // Handle Supabase/DB errors specifically
    if (error) {
      logError(error, { action: 'createModel.insert' }); //
      const { message, fieldErrors } = mapDbError(error);
      return { success: false, error: message, errors: fieldErrors };
    }

    // 4. Revalidate cache and return success
    revalidatePath('/dashboard/models'); //
    return { success: true, modelId: newModel.id }; //

  } catch (err) {
    // Catch unexpected errors during the process
    logError(err, { action: 'createModel.catch_all' });
    // **CORRECTION: Use isPostgrestError check**
    if (isPostgrestError(err)) {
        const { message, fieldErrors } = mapDbError(err);
        return { success: false, error: message, errors: fieldErrors };
    }
    return { success: false, error: 'Ocurrió un error inesperado al intentar crear el modelo.' };
  }
}

// --- updateModel function ---
export async function updateModel(modelId: string, data: ModelFormData) {
  const supabase = await createClient(); //

  // 1. Validate input data
  const validation = modelFormSchema.safeParse(data); //
  if (!validation.success) {
    logError(validation.error, { action: 'updateModel.validation', modelId }); //
    return { success: false, error: 'Los datos enviados no son válidos.', errors: zodErrorToFieldErrors(validation.error) }; //
  }

  // 2. Try updating the database
  try {
    const { error } = await supabase.from('models').update(validation.data).eq('id', modelId); //

    // Handle Supabase/DB errors
    if (error) {
      logError(error, { action: 'updateModel.update', modelId }); //
      const { message, fieldErrors } = mapDbError(error);
      return { success: false, error: message, errors: fieldErrors };
    }

    // 3. Revalidate cache and return success
    revalidatePath(`/dashboard/models`); //
    revalidatePath(`/dashboard/models/${modelId}`); //
    return { success: true }; //

  } catch (err) {
    // Catch unexpected errors
    logError(err, { action: 'updateModel.catch_all', modelId });
    // **CORRECTION: Use isPostgrestError check**
    if (isPostgrestError(err)) {
        const { message, fieldErrors } = mapDbError(err);
        return { success: false, error: message, errors: fieldErrors };
    }
    return { success: false, error: 'Ocurrió un error inesperado al intentar actualizar el modelo.' };
  }
}

// --- deleteModel function ---
export async function deleteModel(modelId: string) {
  const supabase = await createClient(); //

  // 1. Validate ID format (basic check)
  if (!z.string().uuid().safeParse(modelId).success) {
     return { success: false, error: 'ID de modelo inválido.' }; //
  }

  // 2. Try deleting from the database
  try {
    const { error } = await supabase.from('models').delete().eq('id', modelId); //

    // Handle Supabase/DB errors
    if (error) {
      logError(error, { action: 'deleteModel.delete', modelId }); //
      const { message } = mapDbError(error);
      return { success: false, error: message };
    }

    // 3. Revalidate cache and return success
    revalidatePath('/dashboard/models'); //
    return { success: true }; //

  } catch (err) {
    // Catch unexpected errors
    logError(err, { action: 'deleteModel.catch_all', modelId });
    // **CORRECTION: Use isPostgrestError check**
    if (isPostgrestError(err)) {
        const { message } = mapDbError(err);
        return { success: false, error: message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al intentar eliminar el modelo.' };
  }
}