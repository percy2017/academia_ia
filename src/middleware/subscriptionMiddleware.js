import prisma from '../lib/prisma.js';

export const checkActiveSubscription = async (req, res, next) => {
  // El middleware isAuthenticated ya se ejecutó, por lo que req.session.user debe existir.
  const user = req.session.user;

  // Si por alguna razón no hay usuario en la sesión, isAuthenticated debería haberlo manejado.
  // Pero como medida de seguridad, si no existe, no hacemos nada y dejamos que falle más adelante si es necesario.
  if (!user) {
    // Esto no debería ocurrir si isAuthenticated está antes en la cadena.
    return res.redirect('/auth/login');
  }

  // Los administradores siempre tienen acceso.
  if (user.role === 'ADMIN') {
    return next();
  }

  try {
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
    });

    // Si no se encuentra una suscripción activa, redirigir a la página de planes.
    if (!subscription) {
      req.flash('error_msg', 'Necesitas una suscripción activa para acceder a este contenido.');
      return res.redirect('/subscription-plans');
    }

    // Si hay una suscripción activa, permitir el acceso.
    next();
  } catch (error) {
    console.error('Error al verificar la suscripción:', error);
    req.flash('error_msg', 'Hubo un problema al verificar tu suscripción.');
    res.redirect('/dashboard');
  }
};
