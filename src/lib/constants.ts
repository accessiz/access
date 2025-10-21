// Centralized application constants
export const SUPABASE_BUCKET = 'Book_Completo_iZ_Management';
export const SUPABASE_PUBLIC_OBJECT_PREFIX = '/storage/v1/object/public';
export const SUPABASE_PUBLIC_URL = ((): string => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  // Trim trailing slash if present
  return base.replace(/\/$/, '') + SUPABASE_PUBLIC_OBJECT_PREFIX + '/' + SUPABASE_BUCKET;
})();

// 10 MB default upload limit
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
