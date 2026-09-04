import { VideoModel } from '../models/VideoModel.js';
import { UserModel } from '../models/UserModel.js';
import { OrderModel } from '../models/OrderModel.js';
import { SettingsModel } from '../models/SettingsModel.js';
import { uploadFile, deleteFileFromAny, contentTypeFor, bucketForVideo } from '../services/storageService.js';
import { ok, created, badRequest, notFound } from '../utils/apiResponse.js';

export async function createVideo(req, res, next) {
  try {
    const { title, description, category, tags, price, featured, isPublished, duration, rating } = req.body;

    if (!title || !title.trim()) {
      return badRequest(res, 'El título es obligatorio');
    }

    const tagsArray = Array.isArray(tags)
      ? tags.map((t) => String(t).trim()).filter(Boolean)
      : typeof tags === 'string' && tags.trim()
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

    const priceValue = Number(price) || 0;

    // Subir video y thumbnail a Supabase Storage.
    // El bucket del video depende del precio: gratis=publico, premium=privado.
    let videoPath = null;
    let videoBucket = null;
    if (req.files?.video?.[0]) {
      const file = req.files.video[0];
      videoBucket = bucketForVideo(priceValue);
      videoPath = await uploadFile(file.buffer, file.originalname, 'videos', contentTypeFor(file.originalname), videoBucket);
    } else if (req.files?.videoFile) {
      const file = req.files.videoFile[0];
      videoBucket = bucketForVideo(priceValue);
      videoPath = await uploadFile(file.buffer, file.originalname, 'videos', contentTypeFor(file.originalname), videoBucket);
    }

    let thumbnailPath = null;
    if (req.files?.thumbnail?.[0]) {
      const file = req.files.thumbnail[0];
      thumbnailPath = await uploadFile(file.buffer, file.originalname, 'thumbnails', contentTypeFor(file.originalname));
    } else if (req.files?.image?.[0]) {
      const file = req.files.image[0];
      thumbnailPath = await uploadFile(file.buffer, file.originalname, 'thumbnails', contentTypeFor(file.originalname));
    }

    const video = await VideoModel.create({
      title: title.trim(),
      description: description || '',
      category: category || 'General',
      tags: tagsArray,
      price: Number(price) || 0,
      featured: featured === 'true' || featured === true,
      isPublished: isPublished === 'false' ? false : true,
      duration: Number(duration) || 0,
      rating: rating !== undefined ? Number(rating) : 4.5,
      videoPath,
      videoBucket,
      thumbnailPath,
      createdBy: req.user.id
    });

    return created(res, video, 'Video creado correctamente');
  } catch (err) {
    next(err);
  }
}

export async function updateVideo(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return notFound(res, 'Video no válido');
    }

    const existing = await VideoModel.findById(id, { publishedOnly: false });
    if (!existing) {
      return notFound(res, 'Video no encontrado');
    }

    const fields = {};
    const textFields = ['title', 'description', 'category', 'duration', 'price', 'featured', 'isPublished', 'rating', 'tags'];
    for (const key of textFields) {
      if (req.body[key] !== undefined) fields[key] = req.body[key];
    }
    if (fields.tags) {
      fields.tags = Array.isArray(fields.tags)
        ? fields.tags.map((t) => String(t).trim()).filter(Boolean)
        : String(fields.tags).split(',').map((t) => t.trim()).filter(Boolean);
    }
    if (fields.price !== undefined) fields.price = Number(fields.price);
    if (fields.duration !== undefined) fields.duration = Number(fields.duration);
    if (fields.featured !== undefined) fields.featured = fields.featured === 'true' || fields.featured === true;
    if (fields.isPublished !== undefined) fields.isPublished = fields.isPublished === 'false' ? false : fields.isPublished === true || fields.isPublished === 'true';

    // Subir nuevos archivos si vienen
    const files = req.files || {};
    const finalPrice = fields.price !== undefined ? Number(fields.price) : (existing.price !== undefined ? Number(existing.price) : 0);
    if (files.video?.[0] || files.videoFile?.[0]) {
      const file = files.video?.[0] || files.videoFile[0];
      if (existing.video_path) await deleteFileFromAny(existing.video_path);
      const vb = bucketForVideo(finalPrice);
      fields.video_path = (await uploadFile(file.buffer, file.originalname, 'videos', contentTypeFor(file.originalname), vb)).path;
      fields.video_bucket = vb;
    } else if (fields.price !== undefined && existing.video_path) {
      // Si cambia el precio de gratis<->premium y hay video ya subido, actualizamos el bucket
      fields.video_bucket = bucketForVideo(finalPrice);
    }
    if (files.thumbnail?.[0] || files.image?.[0]) {
      const file = files.thumbnail?.[0] || files.image[0];
      if (existing.thumbnail_path) await deleteFileFromAny(existing.thumbnail_path);
      fields.thumbnail_path = (await uploadFile(file.buffer, file.originalname, 'thumbnails', contentTypeFor(file.originalname))).path;
    }

    const video = await VideoModel.update(id, fields);
    return ok(res, video, 'Video actualizado correctamente');
  } catch (err) {
    next(err);
  }
}

export async function deleteVideo(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return notFound(res, 'Video no válido');
    }

    const existing = await VideoModel.findById(id, { publishedOnly: false });
    if (!existing) {
      return notFound(res, 'Video no encontrado');
    }

    if (existing.video_path) await deleteFileFromAny(existing.video_path);
    if (existing.thumbnail_path) await deleteFileFromAny(existing.thumbnail_path);

    await VideoModel.delete(id);
    return ok(res, null, 'Video eliminado correctamente');
  } catch (err) {
    next(err);
  }
}

export async function listAllVideosAdmin(req, res, next) {
  try {
    const data = await VideoModel.findAll({ publishedOnly: false });
    return ok(res, data);
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const { search, role } = req.query;
    const users = await UserModel.findAll({ search, role });
    return ok(res, users.map((u) => UserModel.toSafeUser(u)));
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const id = req.params.id;
    const { role } = req.body;

    if (!['admin', 'client'].includes(role)) {
      return badRequest(res, 'Rol inválido');
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return notFound(res, 'Usuario no encontrado');
    }

    // Evitar que un admin se quite sus propios privilegios de forma que quede sin admins
    if (id === req.user.id && role !== 'admin') {
      return badRequest(res, 'No puedes cambiar tu propio rol de administrador');
    }

    const updated = await UserModel.update(id, { role });
    return ok(res, UserModel.toSafeUser(updated), 'Rol actualizado');
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const id = req.params.id;
    if (id === req.user.id) {
      return badRequest(res, 'No puedes eliminar tu propia cuenta');
    }
    await UserModel.delete(id);
    return ok(res, null, 'Usuario eliminado');
  } catch (err) {
    next(err);
  }
}

export async function getOrders(req, res, next) {
  try {
    const orders = await OrderModel.findAll();
    return ok(res, orders);
  } catch (err) {
    next(err);
  }
}

export async function getSettings(req, res, next) {
  try {
    const settings = await SettingsModel.getAll();
    return ok(res, settings);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return badRequest(res, 'No hay configuración para actualizar');
    }
    await SettingsModel.updateMany(updates);
    const settings = await SettingsModel.getAll();
    return ok(res, settings, 'Configuración actualizada');
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    const [allVideos, allUsers, orderStats] = await Promise.all([
      VideoModel.findAll({ publishedOnly: false }),
      UserModel.findAll(),
      OrderModel.stats()
    ]);

    const published = allVideos.filter((v) => v.is_published);
    const totalViews = allVideos.reduce((s, v) => s + Number(v.views || 0), 0);
    const freeCount = published.filter((v) => Number(v.price) === 0).length;
    const paidCount = published.filter((v) => Number(v.price) > 0).length;

    return ok(res, {
      totalVideos: allVideos.length,
      publishedVideos: published.length,
      totalUsers: allUsers.length,
      adminUsers: allUsers.filter((u) => u.role === 'admin').length,
      clientUsers: allUsers.filter((u) => u.role === 'client').length,
      totalViews,
      freeCount,
      paidCount,
      ...orderStats
    });
  } catch (err) {
    next(err);
  }
}
