import { Router } from 'express';
import { scanController } from '../controllers/scan.controller.js';

const router = Router();

router.post('/verify', scanController.verify);
router.post('/confirm', scanController.confirm);

export default router;
