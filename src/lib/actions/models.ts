'use server'

import { revalidatePath } from 'next/cache'
import { modelFormSchema, ModelFormData } from '@/lib/schemas'
import { z } from 'zod'
import { zodErrorToFieldErrors } from '@/lib/utils/zod'
import { logError } from '@/lib/utils/errors';
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { logActivity } from '@/lib/activity-logger';
import { ActivityTitles } from '@/lib/activity-titles';
import { requireAuthenticatedAction } from '@/lib/actions/server-action-auth'
import * as Sentry from '@sentry/nextjs'

// Helper function to check for Supabase errors
const isPostgrestError = (error: unknown): error is PostgrestError => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

// --- Constraint-to-column mapping ---
const UNIQUE_CONSTRAINTS: Record<string, { column: string; label: string; fieldKey: keyof ModelFormData }> = {
  models_email_key:           { column: 'email',           label: 'correo electrónico', fieldKey: 'email' },
  models_national_id_key:     { column: 'national_id',     label: 'Documento ID',       fieldKey: 'national_id' },
  models_phone_e164_key:      { column: 'phone_e164',      label: 'teléfono',           fieldKey: 'phone_e164' },
  models_passport_number_key: { column: 'passport_number', label: 'pasaporte',          fieldKey: 'passport_number' },
};

/**
 * Look up who already owns a conflicting unique value.
 * Returns the alias or full_name of the existing record, or null if not found.
 */
async function findConflictOwner(
  supabase: SupabaseClient,
  column: string,
  value: unknown,
  excludeId?: string,
): Promise<string | null> {
  if (!value) return null;
  let query = supabase
    .from('models')
    .select('alias, full_name')
    .eq(column, value)
    .limit(1);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data } = await query.single();
  if (!data) return null;
  return data.alias || data.full_name || 'otro talento';
}

/**
 * Map a Postgrest unique-constraint error (23505) to a user-friendly message
 * that includes WHO already owns the conflicting value.
 */
async function mapDbError(
  error: PostgrestError,
  supabase: SupabaseClient,
  submittedData?: ModelFormData,
  existingModelId?: string,
): Promise<{ message: string; fieldErrors?: Record<string, string> }> {

  // --- Unique constraint violation ---
  if (error.code === '23505') {
    // Try to match the specific constraint from error.details
    for (const [constraintName, info] of Object.entries(UNIQUE_CONSTRAINTS)) {
      if (error.details?.includes(constraintName)) {
        const value = submittedData?.[info.fieldKey];
        const owner = await findConflictOwner(supabase, info.column, value, existingModelId);
        const ownerText = owner ? ` por ${owner}` : '';
        return {
          message: value ? `El ${info.label} "${value}" ya está en uso${ownerText}.` : `Este ${info.label} ya está en uso${ownerText}.`,
          fieldErrors: { [info.fieldKey]: `Este ${info.label} ya está en uso${ownerText}.` },
        };
      }
    }

    // Fallback: constraint not recognised — try ALL unique columns to find the conflict
    if (submittedData) {
      for (const info of Object.values(UNIQUE_CONSTRAINTS)) {
        const value = submittedData[info.fieldKey];
        if (!value) continue;
        const owner = await findConflictOwner(supabase, info.column, value, existingModelId);
        if (owner) {
          return {
            message: `El ${info.label} "${value}" ya está en uso por ${owner}.`,
            fieldErrors: { [info.fieldKey]: `Este ${info.label} ya está en uso por ${owner}.` },
          };
        }
      }
    }

    return { message: 'Se encontró un conflicto de datos únicos. Revisa que el email, teléfono, documento ID o pasaporte no estén asignados a otro talento.' };
  }

  // Default fallback
  return { message: 'Ocurrió un error inesperado en la base de datos.' };
}

// --- createModel function ---
export async function createModel(data: ModelFormData) {
  // 1. Validate input data with Zod
  const validation = modelFormSchema.safeParse(data); //
  if (!validation.success) {
    logError(validation.error, { action: 'createModel.validation' }); //
    return { success: false, error: 'Los datos enviados no son válidos.', errors: zodErrorToFieldErrors(validation.error) }; //
  }

  // 2. Get authenticated user
  const auth = await requireAuthenticatedAction('No se pudo autenticar al usuario.')
  if (!auth.user) {
    return { success: false, error: auth.error }
  }

  const { supabase, user } = auth

  // 3. Try inserting into the database
  try {
    const { data: newModel, error } = await supabase
      .from('models')
      .insert({ ...validation.data, user_id: user.id }) //
      .select('id').single(); //

    // Handle Supabase/DB errors specifically
    if (error) {
      logError(error, { action: 'createModel.insert' }); //
      const { message, fieldErrors } = await mapDbError(error, supabase, validation.data);
      return { success: false, error: message, errors: fieldErrors };
    }

    // 4. Revalidate cache and return success
    revalidatePath('/dashboard/models');

    // Log activity
    await logActivity({
      category: 'talent',
      title: ActivityTitles.modelCreated(validation.data.alias || validation.data.full_name),
      metadata: { entity_id: newModel.id, entity_type: 'model', action: 'created' },
    });

    return { success: true, modelId: newModel.id };

  } catch (err) {
    // Catch unexpected errors during the process
    logError(err, { action: 'createModel.catch_all' });
    // **CORRECTION: Use isPostgrestError check**
    if (isPostgrestError(err)) {
      const { message, fieldErrors } = await mapDbError(err, supabase, validation.data);
      return { success: false, error: message, errors: fieldErrors };
    }
    
    // Si es un error de código grave y no un error de base de datos controlado, lo mandamos a Sentry
    Sentry.captureException(err, { extra: { action: 'createModel' } });
    
    return { success: false, error: 'Ocurrió un error inesperado al intentar crear el modelo.' };
  }
}

// --- updateModel function ---
export async function updateModel(modelId: string, data: ModelFormData) {
  // 1. Validate input data
  const validation = modelFormSchema.safeParse(data); //
  if (!validation.success) {
    logError(validation.error, { action: 'updateModel.validation', modelId }); //
    return { success: false, error: 'Los datos enviados no son válidos.', errors: zodErrorToFieldErrors(validation.error) }; //
  }

  const auth = await requireAuthenticatedAction()
  if (!auth.user) {
    return { success: false, error: auth.error }
  }

  const { supabase } = auth

  // 2. Try updating the database
  try {
    const { error } = await supabase.from('models').update(validation.data).eq('id', modelId); //

    // Handle Supabase/DB errors
    if (error) {
      logError(error, { action: 'updateModel.update', modelId }); //
      const { message, fieldErrors } = await mapDbError(error, supabase, validation.data, modelId);
      return { success: false, error: message, errors: fieldErrors };
    }

    // 3. Revalidate cache and return success
    revalidatePath(`/dashboard/models`);
    revalidatePath(`/dashboard/models/${modelId}`);

    // Log activity
    await logActivity({
      category: 'talent',
      title: ActivityTitles.modelUpdated(validation.data.alias || validation.data.full_name),
      metadata: { entity_id: modelId, entity_type: 'model', action: 'updated' },
    });

    return { success: true };

  } catch (err) {
    // Catch unexpected errors
    logError(err, { action: 'updateModel.catch_all', modelId });
    // **CORRECTION: Use isPostgrestError check**
    if (isPostgrestError(err)) {
      const { message, fieldErrors } = await mapDbError(err, supabase, validation.data, modelId);
      return { success: false, error: message, errors: fieldErrors };
    }
    
    // Enviar errores graves a Sentry
    Sentry.captureException(err, { extra: { action: 'updateModel', modelId } });
    
    return { success: false, error: 'Ocurrió un error inesperado al intentar actualizar el modelo.' };
  }
}

// --- deleteModel function ---
export async function deleteModel(modelId: string) {
  // 1. Validate ID format (basic check)
  if (!z.string().uuid().safeParse(modelId).success) {
    return { success: false, error: 'ID de modelo inválido.' }; //
  }

  const auth = await requireAuthenticatedAction()
  if (!auth.user) {
    return { success: false, error: auth.error }
  }

  const { supabase } = auth

  // 2. Try deleting from the database
  try {
    const { error } = await supabase.from('models').delete().eq('id', modelId); //

    // Handle Supabase/DB errors
    if (error) {
      logError(error, { action: 'deleteModel.delete', modelId }); //
      const { message } = await mapDbError(error, supabase);
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
      const { message } = await mapDbError(err, supabase);
      return { success: false, error: message };
    }
    
    Sentry.captureException(err, { extra: { action: 'deleteModel', modelId } });
    
    return { success: false, error: 'Ocurrió un error inesperado al intentar eliminar el modelo.' };
  }
}

// --- toggleModelVisibility ---
export async function toggleModelVisibility(modelId: string, isPublic: boolean) {
  if (!z.string().uuid().safeParse(modelId).success) {
    return { success: false, error: 'ID de modelo inválido.' };
  }

  const auth = await requireAuthenticatedAction()
  if (!auth.user) {
    return { success: false, error: auth.error }
  }

  const { supabase } = auth

  try {
    const { error } = await supabase
      .from('models')
      .update({ is_public: isPublic })
      .eq('id', modelId);

    if (error) {
      logError(error, { action: 'toggleModelVisibility', modelId, isPublic });
      return { success: false, error: 'No se pudo actualizar la visibilidad.' };
    }

    revalidatePath('/dashboard/web');
    return { success: true };

  } catch (err) {
    logError(err, { action: 'toggleModelVisibility.catch_all', modelId });
    Sentry.captureException(err, { extra: { action: 'toggleModelVisibility', modelId } });
    return { success: false, error: 'Error inesperado al cambiar visibilidad.' };
  }
}

// --- updateModelCredentials ---
export async function updateModelCredentials(modelId: string, email: string, password_plain: string) {
  if (!z.string().uuid().safeParse(modelId).success) {
    return { success: false, error: 'ID de modelo inválido.' };
  }
  
  if (!email || email.trim() === '') {
    return { success: false, error: 'El correo electrónico es obligatorio.' };
  }
  
  if (!password_plain || password_plain.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const auth = await requireAuthenticatedAction()
  if (!auth.user) {
    return { success: false, error: auth.error }
  }

  const { supabase } = auth

  try {
    const { error } = await supabase
      .from('models')
      .update({ 
        email: email.toLowerCase().trim(),
        login_password: password_plain 
      })
      .eq('id', modelId);

    if (error) {
      logError(error, { action: 'updateModelCredentials', modelId });
      if (error.code === '23505') {
        return { success: false, error: 'El correo electrónico ya está en uso por otro talento.' };
      }
      return { success: false, error: 'No se pudo actualizar las credenciales.' };
    }

    revalidatePath('/dashboard/models');
    revalidatePath(`/dashboard/models/${modelId}`);
    return { success: true };

  } catch (err) {
    logError(err, { action: 'updateModelCredentials.catch_all', modelId });
    Sentry.captureException(err, { extra: { action: 'updateModelCredentials', modelId } });
    return { success: false, error: 'Error inesperado al actualizar credenciales.' };
  }
}

// --- clearModelPassword ---
export async function clearModelPassword(modelId: string) {
  if (!z.string().uuid().safeParse(modelId).success) {
    return { success: false, error: 'ID de modelo inválido.' };
  }

  const auth = await requireAuthenticatedAction()
  if (!auth.user) {
    return { success: false, error: auth.error }
  }

  const { supabase } = auth

  try {
    const { error } = await supabase
      .from('models')
      .update({ login_password: null })
      .eq('id', modelId);

    if (error) {
      logError(error, { action: 'clearModelPassword', modelId });
      return { success: false, error: 'No se pudo restablecer la contraseña.' };
    }

    revalidatePath('/dashboard/models/access');
    revalidatePath('/dashboard/models');
    revalidatePath(`/dashboard/models/${modelId}`);
    return { success: true };
  } catch (err) {
    logError(err, { action: 'clearModelPassword.catch_all', modelId });
    Sentry.captureException(err, { extra: { action: 'clearModelPassword', modelId } });
    return { success: false, error: 'Error inesperado al restablecer la contraseña.' };
  }
}
