import { Router } from 'express';
import { listSubscriptions, listPendingSubscriptions, approveSubscription } from '../../controllers/admin/subscriptionAdminController.js';

const router = Router();

// El prefijo /admin/subscriptions ya estará aplicado en adminRoutes.js
router.get('/', listSubscriptions);
router.get('/pending', listPendingSubscriptions);
router.post('/:id/approve', approveSubscription);


export default router;
