// Centralized application constants

import { env } from '@/lib/env'

// Legacy Supabase URL constants — kept for possible future use.
export const SUPABASE_BUCKET = 'Book_Completo_iZ_Management';
export const SUPABASE_PUBLIC_OBJECT_PREFIX = '/storage/v1/object/public';
export const SUPABASE_PUBLIC_URL =
  env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '') +
  SUPABASE_PUBLIC_OBJECT_PREFIX + '/' + SUPABASE_BUCKET;

/** Public CDN base URL for R2 images. */
export const R2_PUBLIC_URL = env.NEXT_PUBLIC_R2_PUBLIC_URL;

/** Max upload size: 5 MB. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
