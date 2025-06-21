import express from 'express';
import { isAuthenticated, isAdmin } from '../../middleware/authMiddleware.js';
import {
    listSubscriptionPlans,
    renderCreateSubscriptionPlanForm,
    createSubscriptionPlan,
    renderEditSubscriptionPlanForm,
    updateSubscriptionPlan,
    toggleSubscriptionPlanStatus
} from '../../controllers/admin/subscriptionPlanController.js'; // Asegúrate de que la ruta al controlador sea correcta

const router = express.Router();

// Todas las rutas aquí ya estarán bajo /admin/subscription-plans (definido en adminRoutes.js)

// GET /admin/subscription-plans - Listar todos los planes
router.get('/', isAuthenticated, isAdmin, listSubscriptionPlans);

// GET /admin/subscription-plans/new - Mostrar formulario para crear nuevo plan
router.get('/new', isAuthenticated, isAdmin, renderCreateSubscriptionPlanForm);

// POST /admin/subscription-plans - Crear un nuevo plan
router.post('/', isAuthenticated, isAdmin, createSubscriptionPlan);

// GET /admin/subscription-plans/:id/edit - Mostrar formulario para editar un plan
router.get('/:id/edit', isAuthenticated, isAdmin, renderEditSubscriptionPlanForm);

// PUT /admin/subscription-plans/:id - Actualizar un plan existente
// (Usaremos POST y _method=PUT si es necesario, o el cliente AJAX puede hacer PUT)
// Por ahora, asumimos que el formulario enviará PUT o que se manejará con _method
router.put('/:id', isAuthenticated, isAdmin, updateSubscriptionPlan);

// POST /admin/subscription-plans/:id/toggle-status - Cambiar estado activo/inactivo
router.post('/:id/toggle-status', isAuthenticated, isAdmin, toggleSubscriptionPlanStatus);

// DELETE /admin/subscription-plans/:id - Eliminar un plan (considerar si es mejor solo desactivar)
// router.delete('/:id', isAuthenticated, isAdmin, deleteSubscriptionPlan); 
// Por ahora, nos enfocaremos en toggle-status en lugar de delete.

export default router;
