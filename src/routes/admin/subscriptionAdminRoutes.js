import { Router } from 'express';
import { listSubscriptions } from '../../controllers/admin/subscriptionAdminController.js';

const router = Router();

// El prefijo /admin/subscriptions ya estará aplicado en adminRoutes.js
router.get('/', listSubscriptions);

export default router;
