import prisma from '../../lib/prisma.js';
import { sendEmail } from '../../lib/emailService.js';

export const listSubscriptions = async (req, res) => {
  try {
    const subscriptions = await prisma.userSubscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });
    res.render('admin/subscriptions/index', {
      subscriptions,
      title: 'Gestión de Suscripciones',
      isPendingPage: false, // Asegurarse de que la variable siempre exista
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).send('Error interno del servidor');
  }
};

export const listPendingSubscriptions = async (req, res) => {
  try {
    const pendingSubscriptions = await prisma.userSubscription.findMany({
      where: {
        isPaymentVerified: false,
        paymentGateway: 'qr',
        transactionId: { not: null } // Solo las que tienen un comprobante
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        plan: { select: { name: true } }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    res.render('admin/subscriptions/index', {
      subscriptions: pendingSubscriptions,
      title: 'Suscripciones Pendientes de Verificación',
      isPendingPage: true // Flag para la vista
    });
  } catch (error) {
    console.error('Error fetching pending subscriptions:', error);
    req.flash('error_msg', 'Error al cargar las suscripciones pendientes.');
    res.redirect('/admin/subscriptions');
  }
};

export const approveSubscription = async (req, res) => {
  const { id } = req.params;
  try {
    const subscription = await prisma.userSubscription.findUnique({
      where: { id },
      include: { 
        user: { select: { email: true, name: true } },
        plan: { select: { name: true } }
      }
    });

    if (!subscription) {
      req.flash('error_msg', 'Suscripción no encontrada.');
      return res.redirect('/admin/subscriptions/pending');
    }

    await prisma.userSubscription.update({
      where: { id },
      data: {
        isActive: true,
        isPaymentVerified: true
      }
    });

    // Enviar email de confirmación al usuario
    try {
      const subject = '¡Tu suscripción ha sido activada!';
      const html = `
        <h1>¡Felicidades, ${subscription.user.name}!</h1>
        <p>Tu pago para el plan <strong>${subscription.plan.name}</strong> ha sido verificado y tu suscripción ya está activa.</p>
        <p>Ya puedes disfrutar de todos los beneficios y acceder a todos nuestros cursos.</p>
        <p>El equipo de Academia AI</p>
      `;
      await sendEmail(subscription.user.email, subject, html);
    } catch (emailError) {
      console.error(`Fallo al enviar el correo de confirmación a ${subscription.user.email}:`, emailError);
      // No revertir la operación, pero sí notificar al admin en la UI
      req.flash('error_msg', 'Suscripción aprobada, pero falló el envío del correo de notificación al usuario.');
      return res.redirect('/admin/subscriptions/pending');
    }

    req.flash('success_msg', 'Suscripción aprobada y usuario notificado exitosamente.');
    res.redirect('/admin/subscriptions/pending');

  } catch (error) {
    console.error('Error approving subscription:', error);
    req.flash('error_msg', 'Error al aprobar la suscripción.');
    res.redirect('/admin/subscriptions/pending');
  }
};
