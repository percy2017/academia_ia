import express from 'express';
import mediaController from '../../controllers/admin/mediaController.js';
import { isAdmin } from '../../middleware/authMiddleware.js';
import { upload } from '../../middleware/mediaUploadMiddleware.js';

const router = express.Router();

// Rutas para la gestión de multimedia en el panel de administración
router.get('/', isAdmin, mediaController.getMediaLibrary);
router.post('/upload', isAdmin, upload.array('mediafiles', 10), mediaController.uploadMediaFile); // 'mediafiles' es el name del input, hasta 10 archivos
router.delete('/:id', isAdmin, mediaController.deleteMediaFile);

export default router;
