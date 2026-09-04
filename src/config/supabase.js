import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const BUCKET_PUBLIC = process.env.SUPABASE_BUCKET || 'videos';
export const BUCKET_PRIVATE = process.env.SUPABASE_PRIVATE_BUCKET || 'videos-private';

let supabaseAdmin = null;
let supabaseAnon = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

if (supabaseUrl && process.env.SUPABASE_ANON_KEY) {
  supabaseAnon = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
}

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase no configurado. Establece SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  }
  return supabaseAdmin;
}

export function getBucketName() {
  return BUCKET_PUBLIC;
}

export function getPrivateBucketName() {
  return BUCKET_PRIVATE;
}

/**
 * URL pública para contenido gratuito (bucket público).
 */
export function publicVideoUrl(path) {
  if (!path) return null;
  const url = process.env.SUPABASE_URL;
  return `${url}/storage/v1/object/public/${BUCKET_PUBLIC}/${path}`;
}

/**
 * Genera una URL firmada de corta duración para un archivo premium
 * ubicado en el bucket privado. Solo debe llamarse tras verificar acceso.
 */
export async function signedUrl(path, expiresIn = 600) {
  if (!path) return null;
  const { data, error } = await getSupabaseAdmin()
    .storage
    .from(BUCKET_PRIVATE)
    .createSignedUrl(path, expiresIn);
  if (error) throw new Error(`Error generando acceso al video: ${error.message}`);
  return data?.signedUrl || null;
}

/**
 * Determina el bucket según el precio del video.
 */
export function bucketForVideo(price = 0) {
  return price > 0 ? BUCKET_PRIVATE : BUCKET_PUBLIC;
}
