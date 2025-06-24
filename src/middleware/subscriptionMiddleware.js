import prisma from '../lib/prisma.js';

export const checkActiveSubscription = async (req, res, next) => {
  // Permitir acceso a los administradores sin verificar suscripción
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }

  // Para usuarios no administradores, verificar si están autenticados
  if (!req.user) {
    req.flash('error', 'Debes iniciar sesión para acceder a esta página.');
    return res.redirect('/auth/login');
  }

  try {
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: req.user.id,
        isActive: true,
        endDate: {
          gte: new Date(), // gte = greater than or equal to
        },
      },
    });

    if (!subscription) {
      req.flash('error', 'Tu suscripción ha vencido o no está activa. Por favor, suscríbete para acceder al contenido.');
      return res.redirect('/subscription-plans');
    }

    // Si todo está en orden, continuar con la siguiente función en la ruta
    next();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    req.flash('error', 'Hubo un problema al verificar tu suscripción. Por favor, intenta de nuevo.');
    res.redirect('/dashboard'); // O a una página de error genérica
  }
};
