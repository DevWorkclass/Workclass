import { Router } from 'express';
import { ticketsController } from '../controllers/tickets.controller.js';

const router = Router();

router.post('/generate', ticketsController.generate);
router.post('/get', ticketsController.get);

export default router;
