
// Centralized application constants

// NOTA: Estas constantes de Supabase ya no se usan para construir URLs públicas,
// pero pueden ser útiles para otras operaciones. Las mantenemos por ahora.
export const SUPABASE_BUCKET = 'Book_Completo_iZ_Management';
export const SUPABASE_PUBLIC_OBJECT_PREFIX = '/storage/v1/object/public';
export const SUPABASE_PUBLIC_URL = ((): string => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return base.replace(/\/$/, '') + SUPABASE_PUBLIC_OBJECT_PREFIX + '/' + SUPABASE_BUCKET;
})();

// URL pública del bucket de R2, para construir las URLs de las imágenes
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';


// Límite de subida de 5 MB
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
