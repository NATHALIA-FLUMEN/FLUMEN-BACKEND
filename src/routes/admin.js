import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { uploadAny } from '../middleware/upload.js';
import {
  createVideo,
  updateVideo,
  deleteVideo,
  listAllVideosAdmin,
  listUsers,
  updateUserRole,
  deleteUser,
  getOrders,
  getSettings,
  updateSettings,
  getDashboardStats
} from '../controllers/adminController.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);

router.get('/videos', listAllVideosAdmin);
router.post('/videos', uploadAny.fields([
  { name: 'video', maxCount: 1 },
  { name: 'videoFile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), createVideo);

router.put('/videos/:id', uploadAny.fields([
  { name: 'video', maxCount: 1 },
  { name: 'videoFile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), updateVideo);
router.delete('/videos/:id', deleteVideo);

router.get('/users', listUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/orders', getOrders);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
