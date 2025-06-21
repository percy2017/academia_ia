import prisma from '../../lib/prisma.js';
// Helper para generar slugs (ejemplo, puedes usar una librería como slugify)
const generateSlug = (name) => {
  return name
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Reemplazar espacios con -
    .replace(/[^\w-]+/g, '') // Remover caracteres no alfanuméricos excepto -
    .replace(/--+/g, '-') // Reemplazar múltiples - con uno solo
    .replace(/^-+/, '') // Quitar - del inicio
    .replace(/-+$/, ''); // Quitar - del final
};

// Listar todos los tags
export const listTags = async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
    res.render('admin/tags/index', { 
      tags, 
      title: 'Administrar Tags',
      layout: 'layouts/main' // Asegurarse que usa el layout correcto
    });
  } catch (error) {
    console.error('Error al listar tags:', error);
    req.flash('error_msg', 'Error al cargar los tags.');
    res.redirect('/admin'); // O a una página de error general del admin
  }
};

// Mostrar formulario para crear nuevo tag
export const renderCreateTagForm = (req, res) => {
  res.render('admin/tags/form', { 
    title: 'Crear Nuevo Tag', 
    tag: {}, // Objeto vacío para el formulario de creación
    layout: 'layouts/main'
  });
};

// Crear un nuevo tag
export const createTag = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    req.flash('error_msg', 'El nombre del tag es requerido.');
    return res.redirect('/admin/tags/create');
  }
  try {
    const slug = generateSlug(name);
    await prisma.tag.create({
      data: { name, slug },
    });
    req.flash('success_msg', 'Tag creado exitosamente.');
    res.redirect('/admin/tags');
  } catch (error) {
    console.error('Error al crear tag:', error);
    // Comprobar si el error es por unicidad (P2002 para Prisma)
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      req.flash('error_msg', `Error: Ya existe un tag con el nombre "${name}".`);
    } else if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      req.flash('error_msg', `Error: Ya existe un tag con el slug generado para "${name}". Intente con un nombre ligeramente diferente.`);
    } else {
      req.flash('error_msg', 'Error al crear el tag.');
    }
    res.redirect('/admin/tags/create');
  }
};

// Mostrar formulario para editar un tag
export const renderEditTagForm = async (req, res) => {
  const { id } = req.params;
  try {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      req.flash('error_msg', 'Tag no encontrado.');
      return res.redirect('/admin/tags');
    }
    res.render('admin/tags/form', { 
      title: 'Editar Tag', 
      tag,
      layout: 'layouts/main'
    });
  } catch (error) {
    console.error('Error al buscar tag para editar:', error);
    req.flash('error_msg', 'Error al cargar el tag para editar.');
    res.redirect('/admin/tags');
  }
};

// Actualizar un tag
export const updateTag = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    req.flash('error_msg', 'El nombre del tag es requerido.');
    return res.redirect(`/admin/tags/${id}/edit`);
  }
  try {
    const slug = generateSlug(name);
    await prisma.tag.update({
      where: { id },
      data: { name, slug },
    });
    req.flash('success_msg', 'Tag actualizado exitosamente.');
    res.redirect('/admin/tags');
  } catch (error) {
    console.error('Error al actualizar tag:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      req.flash('error_msg', `Error: Ya existe otro tag con el nombre "${name}".`);
    } else if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      req.flash('error_msg', `Error: Ya existe otro tag con el slug generado para "${name}". Intente con un nombre ligeramente diferente.`);
    } else {
      req.flash('error_msg', 'Error al actualizar el tag.');
    }
    res.redirect(`/admin/tags/${id}/edit`);
  }
};

// Eliminar un tag
export const deleteTag = async (req, res) => {
  const { id } = req.params;
  try {
    // Opcional: Verificar si el tag está siendo usado por algún curso antes de eliminar
    // const coursesWithTag = await prisma.course.count({ where: { tags: { some: { id } } } });
    // if (coursesWithTag > 0) {
    //   req.flash('error_msg', 'Este tag está siendo utilizado por uno o más cursos y no puede ser eliminado.');
    //   return res.redirect('/admin/tags');
    // }
    await prisma.tag.delete({ where: { id } });
    req.flash('success_msg', 'Tag eliminado exitosamente.');
    res.redirect('/admin/tags');
  } catch (error) {
    console.error('Error al eliminar tag:', error);
    req.flash('error_msg', 'Error al eliminar el tag.');
    res.redirect('/admin/tags');
  }
};
