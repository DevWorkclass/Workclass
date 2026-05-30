/**
 * Routes payments (v1 placeholder).
 *  - POST /payments/initiate  : initie un paiement (simulation v1)
 *  - POST /payments/simulate  : marque un paiement comme réussi (dev)
 */

import { Router } from 'express';
import { PaymentsController } from '../controllers/payments.controller';

const router = Router();
const controller = new PaymentsController();

router.post('/payments/initiate', controller.initiate.bind(controller));
router.post('/payments/simulate', controller.simulate.bind(controller));

export { router as paymentsRoutes };
