import { VideoModel } from '../models/VideoModel.js';
import { ok, notFound } from '../utils/apiResponse.js';

export const getVideos = async (req, res, next) => {
  try {
    const { category, term, free, paid, featured } = req.query;
    const data = await VideoModel.findAll({ category, term, free, paid, featured });
    return ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const getVideoById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return notFound(res, 'Video no válido');
    }

    const video = await VideoModel.findById(id);
    if (!video) {
      return notFound(res, 'No se encontró el video solicitado');
    }

    video.views = await VideoModel.incrementViews(id);
    return ok(res, video);
  } catch (err) {
    next(err);
  }
};

export const getFeaturedVideos = async (req, res, next) => {
  try {
    const data = await VideoModel.findFeatured();
    return ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const data = await VideoModel.categories();
    return ok(res, data);
  } catch (err) {
    next(err);
  }
};
