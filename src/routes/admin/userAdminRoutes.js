import express from 'express';
import { isAuthenticated, isAdmin } from '../../middleware/authMiddleware.js';
import { 
    listUsers,
    viewUser, // Nueva función para ver detalles y progreso
    renderEditUserForm, 
    updateUser,
    assignUserSubscription, // Importar la nueva función
    resendUserVerificationEmail,
    deleteUser
} from '../../controllers/admin/userAdminController.js';

const router = express.Router();

// Proteger todas las rutas de admin de usuarios
router.use(isAuthenticated);
router.use(isAdmin);

// GET /admin/users - Listar todos los usuarios
router.get('/', listUsers);

// GET /admin/users/:id - Mostrar detalles y progreso del usuario
router.get('/:id', viewUser);

// GET /admin/users/:id/edit - Mostrar formulario para editar usuario
router.get('/:id/edit', renderEditUserForm);

// PUT /admin/users/:id - Actualizar usuario
router.put('/:id', updateUser);

// POST /admin/users/:userId/assign-subscription - Asignar/actualizar suscripción a un usuario
router.post('/:userId/assign-subscription', assignUserSubscription);

// POST /admin/users/:id/resend-verification - Reenviar correo de verificación
router.post('/:id/resend-verification', resendUserVerificationEmail);

// DELETE /admin/users/:id - Eliminar un usuario
router.delete('/:id', deleteUser);

export default router;
