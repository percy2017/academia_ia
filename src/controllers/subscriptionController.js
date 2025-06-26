import prisma from '../lib/prisma.js';

// @desc    Display subscription plans page
// @route   GET /subscription-plans
// @access  Private
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    const usdToBobRate = parseFloat(process.env.USD_TO_BOB_RATE) || null;

    res.render('subscription-plans', {
      title: 'Elige tu Plan',
      plans,
      user: req.session.user,
      usdToBobRate
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).send('Error al cargar los planes de suscripción.');
  }
};

// @desc    Create a new subscription for a user
// @route   POST /subscribe/:planId
// @access  Private
export const subscribeToPlan = async (req, res) => {
  const { planId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Verificar que el plan exista y esté activo
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }, // CORREGIDO: El ID es un string (CUID)
    });

    if (!plan || !plan.isActive) {
      req.flash('error', 'El plan seleccionado no es válido o no está disponible.');
      return res.redirect('/subscription-plans');
    }

    // 2. (Opcional) Verificar si el usuario ya tiene una suscripción activa
    const existingSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId: userId,
        isActive: true,
        endDate: { gte: new Date() }
      }
    });

    if (existingSubscription) {
      req.flash('info', 'Ya tienes una suscripción activa.');
      return res.redirect('/dashboard');
    }

    // 3. Crear la nueva suscripción
    const startDate = new Date();
    const endDate = new Date(startDate); // Clonar la fecha de inicio
    // CORREGIDO: Usar durationMonths del schema y sumar meses correctamente
    endDate.setMonth(endDate.getMonth() + plan.durationMonths); 
    if (plan.bonusMonths) {
      endDate.setMonth(endDate.getMonth() + plan.bonusMonths);
    }

    await prisma.userSubscription.create({
      data: {
        userId: userId,
        planId: plan.id,
        startDate: startDate,
        endDate: endDate,
        isActive: true,
      },
    });

    req.flash('success', `¡Felicidades! Te has suscrito al plan ${plan.name}.`);
    res.redirect('/dashboard');

  } catch (error) {
    console.error('Error creating subscription:', error);
    req.flash('error', 'Hubo un problema al procesar tu suscripción.');
    res.redirect('/subscription-plans');
  }
};

// @desc    Display checkout page for a specific plan
// @route   GET /checkout/:planId
// @access  Private
export const getCheckoutPage = async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId, isActive: true },
    });

    if (!plan) {
      req.flash('error_msg', 'El plan de suscripción no fue encontrado o no está activo.');
      return res.redirect('/subscription-plans');
    }

    res.render('checkout', {
      title: 'Confirmar Compra',
      plan,
      user: req.session.user,
    });
  } catch (error) {
    console.error('Error fetching checkout page:', error);
    res.status(500).send('Error al cargar la página de checkout.');
  }
};
