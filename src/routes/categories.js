import { Router } from 'express';
import { getCategories } from '../controllers/videoController.js';

const router = Router();

router.get('/', getCategories);

export default router;
