/**
 * Routes booking — toutes en POST (données sensibles).
 */

import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller.js';

const router = Router();

router.post('/create', bookingController.create);
router.post('/lookup', bookingController.lookup);

export default router;
