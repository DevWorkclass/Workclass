import { Router } from 'express';
import { feedbackController } from '../controllers/feedback.controller.js';

const router = Router();

router.post('/validate', feedbackController.validate);
router.post('/submit', feedbackController.submit);

export default router;
