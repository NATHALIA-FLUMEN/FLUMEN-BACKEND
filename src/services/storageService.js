import { getSupabaseAdmin, BUCKET_PUBLIC, BUCKET_PRIVATE } from '../config/supabase.js';
import path from 'path';

function generateFileName(originalName, prefix) {
  const ext = path.extname(originalName || '').toLowerCase() || '.bin';
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}/${base || 'file'}-${unique}${ext}`;
}

/**
 * Sube un archivo al bucket indicado.
 * - Para contenido gratis: bucket público
 * - Para contenido premium: bucket privado (protegido con URLs firmadas)
 */
export async function uploadFile(buffer, originalName, prefix, contentType, bucket = BUCKET_PUBLIC) {
  const filePath = generateFileName(originalName, prefix);

  const { error } = await getSupabaseAdmin()
    .storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType,
      upsert: false,
      cacheControl: '3600'
    });

  if (error) throw new Error(`Error al subir archivo: ${error.message}`);

  return { path: filePath, bucket };
}

export async function deleteFile(filePath, bucket = BUCKET_PUBLIC) {
  if (!filePath) return;
  const { error } = await getSupabaseAdmin().storage.from(bucket).remove([filePath]);
  if (error) {
    console.error('Error borrando archivo:', error.message);
  }
}

export async function deleteFileFromAny(path, buckets = [BUCKET_PUBLIC, BUCKET_PRIVATE]) {
  if (!path) return;
  for (const bucket of buckets) {
    const { data, error } = await getSupabaseAdmin().storage.from(bucket).list('', { search: path });
    if (error) continue;
    if (data && data.length > 0) {
      await deleteFile(path, bucket);
      return; // ya se eliminó en el bucket correcto
    }
  }
  // Fallback: intentar en el bucket público (comportamiento por defecto)
  await deleteFile(path, BUCKET_PUBLIC);
}

export function contentTypeFor(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  const map = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.m4v': 'video/x-m4v',
    '.mpg': 'video/mpeg',
    '.mpeg': 'video/mpeg',
    '.avi': 'video/avi',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.avif': 'image/avif'
  };
  return map[ext] || 'application/octet-stream';
}

/**
 * Devuelve el bucket según el precio (mayor a 0 = privado/premium).
 */
export function bucketForVideo(price = 0) {
  return Number(price) > 0 ? BUCKET_PRIVATE : BUCKET_PUBLIC;
}
