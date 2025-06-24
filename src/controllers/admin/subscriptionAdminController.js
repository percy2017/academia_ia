import prisma from '../../lib/prisma.js';

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
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).send('Error interno del servidor');
  }
};
