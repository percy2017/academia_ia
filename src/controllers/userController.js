import prisma from '../lib/prisma.js';
import fs from 'fs/promises'; // Para eliminar archivos antiguos
import path from 'path'; // Para construir rutas de archivos
import { fileURLToPath } from 'url';

// __dirname equivalent for ES modules, necesario para construir rutas a public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Renderiza la página de perfil del usuario
export const renderProfilePage = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.redirect('/auth/login?error=Debes iniciar sesión para ver tu perfil.');
    }
    const userId = req.session.user.id;
    // Obtener usuario de la BD para asegurar datos frescos, incluyendo avatarUrl
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      req.session.destroy();
      return res.redirect('/auth/login?error=Usuario no encontrado.');
    }
    // Sincronizar sesión por si acaso
    req.session.user = { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        avatarUrl: user.avatarUrl 
    };

    // Obtener las suscripciones activas del usuario
    const userSubscriptions = await prisma.userSubscription.findMany({
      where: { 
        userId: userId,
        isActive: true // Solo mostrar suscripciones activas
      },
      include: {
        plan: true, // Incluir los detalles del plan de suscripción
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    // NOTA: Con el modelo de suscripción, el usuario tiene acceso a TODOS los cursos.
    // La lógica de "cursos inscritos" cambia. Por ahora, pasaremos las suscripciones.
    // Si quisieras mostrar cursos, tendríamos que obtener todos los cursos publicados.
    // Vamos a pasar las suscripciones a la vista por ahora.
    
    res.render('profile', {
      title: 'Mi Perfil - Academia AI',
      user: user,
      subscriptions: userSubscriptions, // Pasar suscripciones a la vista
      currentPath: '/profile',
      success_msg: req.query.success_msg, // Para mostrar mensajes de éxito (ej. después de actualizar)
      messages: req.flash() // Asegurar que los mensajes flash estén disponibles
    });
  } catch (error) {
    console.error("Error al renderizar la página de perfil:", error);
    res.status(500).send('Error al cargar la página de perfil.');
  }
};

// Renderiza la página para editar el perfil del usuario
export const renderEditProfilePage = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.redirect('/auth/login?error=Debes iniciar sesión para editar tu perfil.');
    }
    const userId = req.session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, avatarUrl: true, role: true } // Incluir role
    });

    if (!user) {
      req.session.destroy();
      return res.redirect('/auth/login?error=Usuario no encontrado.');
    }

    res.render('edit-profile', {
      title: 'Editar Perfil - Academia AI',
      user: user,
      currentPath: '/profile/edit',
      error: req.query.error,
      success_msg: req.query.success_msg
    });
  } catch (error) {
    console.error("Error al renderizar la página de edición de perfil:", error);
    res.status(500).send('Error al cargar la página de edición de perfil.');
  }
};

// Maneja la actualización del perfil del usuario
export const updateUserProfile = async (req, res) => {
  const userId = req.session.user.id; // Asumimos que isAuthenticated ya verificó la sesión

  try {
    const { name, phone } = req.body;
    const oldAvatarPath = req.session.user.avatarUrl; // Avatar actual antes de cualquier cambio
    let newAvatarUrl = oldAvatarPath; // Por defecto, mantener el avatar actual

    // Validación básica
    if (!name || name.trim() === '') {
      const currentUserData = await prisma.user.findUnique({ 
        where: { id: userId }, 
        select: { name: true, email: true, phone: true, avatarUrl: true }
      });
      return res.render('edit-profile', {
        title: 'Editar Perfil - Academia AI',
        user: currentUserData,
        currentPath: '/profile/edit',
        error: 'El nombre es requerido.'
      });
    }

    // Manejar la subida del nuevo avatar
    if (req.file) {
      newAvatarUrl = `/uploads/avatars/${req.file.filename}`;
      // Si hay un avatar antiguo y es diferente del nuevo, intentar eliminarlo
      if (oldAvatarPath && oldAvatarPath !== newAvatarUrl) {
        const fullOldPath = path.join(__dirname, '../../public', oldAvatarPath);
        try {
          await fs.access(fullOldPath); // Verificar si existe
          await fs.unlink(fullOldPath); // Eliminar
        } catch (err) {
          // No hacer nada si el archivo no existe o no se puede eliminar, solo loguear
          console.warn(`No se pudo eliminar el avatar antiguo: ${fullOldPath}`, err.message);
        }
      }
    }

    const dataToUpdate = {
      name: name.trim(),
      phone: phone ? phone.trim() : null,
    };

    // Solo añadir avatarUrl a dataToUpdate si realmente cambió
    if (newAvatarUrl !== oldAvatarPath) {
      dataToUpdate.avatarUrl = newAvatarUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    // Actualizar la información del usuario en la sesión
    req.session.user.name = updatedUser.name;
    req.session.user.avatarUrl = updatedUser.avatarUrl;

    res.redirect('/profile?success_msg=Perfil actualizado exitosamente.');

  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    // Si hay un error, es posible que el archivo se haya subido pero la BD falló.
    // En un sistema de producción, se podría querer eliminar el archivo subido si la tx falla.
    // Por ahora, solo redirigimos con error.
    const currentUserData = await prisma.user.findUnique({ 
        where: { id: userId }, // Usar userId que está definido
        select: { name: true, email: true, phone: true, avatarUrl: true }
    });
    return res.render('edit-profile', {
      title: 'Editar Perfil - Academia AI',
      user: currentUserData, // Pasar los datos actuales (o los que se intentaron guardar si se prefiere)
      currentPath: '/profile/edit',
      error: 'Error al actualizar el perfil. Inténtalo de nuevo.'
    });
  }
};
