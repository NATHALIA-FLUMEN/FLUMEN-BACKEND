import { Router } from 'express';
import {
  register,
  login,
  loginOrRegisterGoogle,
  getMe,
  updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  validate,
  registerValidation,
  loginValidation,
  googleValidation,
  profileUpdateValidation
} from '../middleware/validation.js';

const router = Router();

router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/google', validate(googleValidation), loginOrRegisterGoogle);

router.get('/me', protect, getMe);
router.put('/me', protect, validate(profileUpdateValidation), updateProfile);

export default router;
