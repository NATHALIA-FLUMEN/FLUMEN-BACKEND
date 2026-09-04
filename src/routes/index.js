import { Router } from 'express';
import videoRoutes from './videos.js';
import categoryRoutes from './categories.js';
import adminRoutes from './admin.js';
import paymentRoutes from './payments.js';
import { getVideos } from '../controllers/videoController.js';
import { SettingsModel } from '../models/SettingsModel.js';
import { ok } from '../utils/apiResponse.js';

const router = Router();

router.get('/', getVideos);

router.get('/config', async (req, res, next) => {
  try {
    const settings = await SettingsModel.getPublic();
    res.status(200).json({
      success: true,
      data: {
        ...settings,
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
          ? process.env.STRIPE_PUBLISHABLE_KEY
          : null,
        recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
          ? process.env.RECAPTCHA_SITE_KEY
          : null,
        googleClientId: process.env.GOOGLE_CLIENT_ID
          ? process.env.GOOGLE_CLIENT_ID
          : null
      }
    });
  } catch (err) {
    next(err);
  }
});

router.use('/videos', videoRoutes);
router.use('/categories', categoryRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

export default router;
