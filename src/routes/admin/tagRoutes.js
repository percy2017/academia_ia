import express from 'express';
import {
  listTags,
  renderCreateTagForm,
  createTag,
  renderEditTagForm,
  updateTag,
  deleteTag,
} from '../../controllers/admin/tagController.js';
// El middleware isAdmin se aplica en adminRoutes.js al montar este router.

const router = express.Router();

// GET /admin/tags - Listar todos los tags
router.get('/', listTags);

// GET /admin/tags/create - Mostrar formulario para crear nuevo tag
router.get('/create', renderCreateTagForm);

// POST /admin/tags - Crear un nuevo tag
router.post('/', createTag);

// GET /admin/tags/:id/edit - Mostrar formulario para editar un tag
router.get('/:id/edit', renderEditTagForm);

// PUT /admin/tags/:id - Actualizar un tag
router.put('/:id', updateTag);

// DELETE /admin/tags/:id - Eliminar un tag
router.delete('/:id', deleteTag);

export default router;
