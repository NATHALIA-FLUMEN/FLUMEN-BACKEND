import { VideoModel } from '../models/VideoModel.js';
import { OrderModel } from '../models/OrderModel.js';
import { signedUrl } from '../config/supabase.js';
import { ok, notFound, unauthorized, badRequest } from '../utils/apiResponse.js';

/**
 * Endpoint para obtener la URL de reproducción de un video con protección DRM:
 * - Videos gratis: se entrega la URL pública del bucket público.
 * - Videos premium: solo se entrega una URL FIRMADA (bucket privado) si el
 *   usuario autenticado compró el video y tiene acceso. Los usuarios sin
 *   acceso o sin sesión reciben 401.
 * - Administradores: siempre pueden reproducir.
 */
export async function getPlaybackUrl(req, res, next) {
  try {
    const id = Number(req.params.videoId);
    if (!Number.isInteger(id) || id <= 0) {
      return badRequest(res, 'Video no válido');
    }

    const video = await VideoModel.findById(id);
    if (!video) {
      return notFound(res, 'Video no encontrado');
    }

    if (!video.is_published && req.user?.role !== 'admin') {
      return notFound(res, 'Video no disponible');
    }

    const isPaid = Number(video.price) > 0;

    // ---- Videos GRATIS (bucket público): sin autenticación requerida ----
    if (!isPaid) {
      return ok(res, {
        url: video.videoUrl,
        thumbnail: video.thumbnail,
        title: video.title,
        isFree: true,
        access: true
      });
    }

    // ---- Videos PREMIUM (bucket privado): requiere acceso comprado ----
    if (!req.user) {
      return unauthorized(res, 'Inicia sesión para ver este video premium');
    }

    if (req.user.role === 'admin') {
      const url = await signedUrl(video.video_path, 900);
      return ok(res, {
        url,
        thumbnail: video.thumbnail,
        title: video.title,
        isFree: false,
        access: true,
        admin: true
      });
    }

    const hasAccess = await OrderModel.hasAccess(req.user.id, video.id);
    if (!hasAccess) {
      return unauthorized(res, 'Debes comprar este video para poder verlo');
    }

    const url = await signedUrl(video.video_path, 900);
    return ok(res, {
      url,
      thumbnail: video.thumbnail,
      title: video.title,
      isFree: false,
      access: true
    });
  } catch (err) {
    next(err);
  }
}
