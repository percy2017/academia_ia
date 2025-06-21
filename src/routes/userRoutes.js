import express from 'express';
import { renderProfilePage, renderEditProfilePage, updateUserProfile } from '../controllers/userController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js'; // Asumiendo que este middleware protege rutas
import { uploadAvatar } from '../middleware/uploadMiddleware.js'; // Importar como exportación nombrada

const router = express.Router();

// Ruta para mostrar la página de perfil del usuario
// Protegida por el middleware isAuthenticated para asegurar que solo usuarios logueados puedan acceder
router.get('/profile', isAuthenticated, renderProfilePage);

// Ruta para mostrar la página de edición de perfil
router.get('/profile/edit', isAuthenticated, renderEditProfilePage);

// Ruta para procesar la actualización del perfil
// Usar uploadAvatar.single('avatar') para manejar la subida del archivo con el nombre de campo 'avatar'
router.post('/profile/update', isAuthenticated, uploadAvatar.single('avatar'), updateUserProfile);

export default router;
