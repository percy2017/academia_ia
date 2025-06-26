import prisma from '../lib/prisma.js';
import { sendEmail } from '../lib/emailService.js';
// @desc    Crear una orden de pago en PayPal
// @route   POST /payment/paypal/create-order
// @access  Private
export const createPaypalOrder = async (req, res) => {
  const { planId } = req.body;
  const userId = req.session.user.id;

  try {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

    if (!plan) {
      req.flash('error', 'El plan seleccionado no existe.');
      return res.redirect('/subscription-plans');
    }

    // Lógica para crear la orden en PayPal...
    // Por ahora, solo mostraremos un mensaje.
    res.send(`Creando orden de PayPal para el plan ${plan.name}. Próximamente...`);

  } catch (error) {
    console.error('Error al crear la orden de PayPal:', error);
    req.flash('error', 'Hubo un error al procesar tu solicitud de pago.');
    res.redirect('/subscription-plans');
  }
};

// @desc    Upload a payment receipt for QR payment
// @route   POST /payment/qr/upload-receipt
// @access  Private
export const uploadQrReceipt = async (req, res) => {
    const { subscriptionId } = req.body;
    const { id: userId, name: userName, email: userEmail } = req.session.user;

    if (!req.file) {
        req.flash('error', 'Debes seleccionar un archivo de imagen como comprobante.');
        return res.redirect('back');
    }

    try {
        const subscription = await prisma.userSubscription.findUnique({
            where: { id: subscriptionId },
            include: { plan: true } // Incluir datos del plan para el email
        });

        if (!subscription || subscription.userId !== userId) {
            req.flash('error', 'Suscripción no válida.');
            return res.redirect('/subscription-plans');
        }

        const receiptPath = `/uploads/receipts/${req.file.filename}`;
        
        await prisma.userSubscription.update({
            where: { id: subscriptionId },
            data: { transactionId: receiptPath }
        });

        // Enviar notificación por correo al administrador
        try {
            const adminEmail = process.env.EMAIL_USER; // Usar el correo del sistema como admin email
            if (adminEmail) {
                const subject = `Nuevo Comprobante de Pago Recibido - ${subscription.plan.name}`;
                const html = `
                    <h1>Nuevo Comprobante de Pago</h1>
                    <p>El usuario <strong>${userName}</strong> (Email: ${userEmail}) ha subido un comprobante de pago para la suscripción al plan <strong>${subscription.plan.name}</strong>.</p>
                    <p>Por favor, verifica la transacción y aprueba la suscripción en el panel de administración.</p>
                    <p>Puedes ver el comprobante aquí: <a href="${req.protocol}://${req.get('host')}${receiptPath}">Ver Comprobante</a></p>
                `;
                await sendEmail(adminEmail, subject, html);
            }
        } catch (emailError) {
            console.error("Fallo al enviar el correo de notificación al admin:", emailError);
            // No detenemos el flujo si el email falla, pero es importante loguearlo.
        }

        req.flash('success', 'Comprobante enviado correctamente. Tu pago será verificado por un administrador a la brevedad.');
        res.redirect('/profile');

    } catch (error) {
        console.error('Error al subir el comprobante de pago:', error);
        req.flash('error', 'Hubo un error al procesar tu comprobante.');
        res.redirect('/subscription-plans');
    }
};

// @desc    Generar un código QR para el pago
// @route   POST /payment/qr/generate
// @access  Private
export const generateQrCode = async (req, res) => {
  const { planId } = req.body;
    const userId = req.session.user.id;

  try {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

    if (!plan) {
      req.flash('error', 'El plan seleccionado no existe.');
      return res.redirect('/subscription-plans');
    }

    // Evitar duplicados: Buscar una suscripción pendiente existente para este usuario y plan
    let subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: userId,
        planId: plan.id,
        isActive: false,
        paymentGateway: 'qr',
      },
    });

    if (!subscription) {
      // Si no existe una pendiente, crear una nueva
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + plan.durationMonths);
      if (plan.bonusMonths) {
        endDate.setMonth(endDate.getMonth() + plan.bonusMonths);
      }

      subscription = await prisma.userSubscription.create({
        data: {
          userId: userId,
          planId: plan.id,
          startDate: startDate,
          endDate: endDate,
          isActive: false,
          isPaymentVerified: false,
          paymentGateway: 'qr',
        },
      });
    }

    // Renderizar la página con el QR
    const qrLink = process.env.QR_PAYMENT_LINK;
    if (!qrLink) {
        throw new Error('La URL de pago por QR no está configurada en el servidor.');
    }

    const exchangeRate = parseFloat(process.env.USD_TO_BOB_RATE);
    const amountInBob = (parseFloat(plan.price) * exchangeRate).toFixed(2);

    res.render('payment/qr', {
        title: 'Pago con QR',
        plan,
        qrLink,
        amountInBob,
        subscriptionId: subscription.id, // Usar el ID de la suscripción encontrada o creada
        user: req.session.user
    });

  } catch (error) {
    console.error('Error al generar el pago por QR:', error);
    req.flash('error', 'Hubo un error al procesar tu solicitud de pago por QR.');
    res.redirect('/subscription-plans');
  }
};
