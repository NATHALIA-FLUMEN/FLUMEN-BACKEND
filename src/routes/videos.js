import { Router } from 'express';
import {
  getVideos,
  getVideoById,
  getFeaturedVideos
} from '../controllers/videoController.js';
import { getPlaybackUrl } from '../controllers/playbackController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', getVideos);
router.get('/featured', getFeaturedVideos);
router.get('/playback/:videoId', optionalAuth, getPlaybackUrl);
router.get('/:id', getVideoById);

export default router;
