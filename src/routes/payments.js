import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  createCheckoutSession,
  confirmPayment,
  checkAccess
} from '../controllers/paymentController.js';
import { OrderModel } from '../models/OrderModel.js';
import { ok } from '../utils/apiResponse.js';

const router = Router();

router.use(protect);

router.post('/checkout', createCheckoutSession);
router.post('/confirm', confirmPayment);
router.get('/access/:videoId', checkAccess);
router.get('/mis-ordenes', async (req, res, next) => {
  try {
    const orders = await OrderModel.findByUser(req.user.id);
    return ok(res, orders);
  } catch (err) {
    next(err);
  }
});

export default router;
