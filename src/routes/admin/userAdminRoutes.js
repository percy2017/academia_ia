import express from 'express';
import { isAuthenticated, isAdmin } from '../../middleware/authMiddleware.js';
import { 
    listUsers, 
    renderEditUserForm, 
    updateUser,
    assignUserSubscription // Importar la nueva función
} from '../../controllers/admin/userAdminController.js';

const router = express.Router();

// Proteger todas las rutas de admin de usuarios
router.use(isAuthenticated);
router.use(isAdmin);

// GET /admin/users - Listar todos los usuarios
router.get('/', listUsers);

// GET /admin/users/:id/edit - Mostrar formulario para editar usuario
router.get('/:id/edit', renderEditUserForm);

// PUT /admin/users/:id - Actualizar usuario
router.put('/:id', updateUser);

// POST /admin/users/:userId/assign-subscription - Asignar/actualizar suscripción a un usuario
router.post('/:userId/assign-subscription', assignUserSubscription);

export default router;
