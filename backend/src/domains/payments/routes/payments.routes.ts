import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller.js';

const router = Router();

router.post('/initiate', paymentsController.initiate);

export default router;
