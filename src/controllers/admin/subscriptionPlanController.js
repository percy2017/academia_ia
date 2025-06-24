import prisma from '../../lib/prisma.js'; // Ajusta la ruta si es necesario

// Listar todos los planes de suscripción
export const listSubscriptionPlans = async (req, res) => {
    try {
        const plans = await prisma.subscriptionPlan.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.render('admin/subscription_plans/index', {
            title: 'Planes de Suscripción',
            plans,
            messages: req.flash()
        });
    } catch (error) {
        console.error("Error fetching subscription plans:", error);
        req.flash('error_msg', 'Error al cargar los planes de suscripción.');
        res.redirect('/admin'); // O a una página de error apropiada
    }
};

// Mostrar formulario para crear un nuevo plan
export const renderCreateSubscriptionPlanForm = async (req, res) => {
    res.render('admin/subscription_plans/form', {
        title: 'Crear Nuevo Plan de Suscripción',
        plan: {}, // Objeto vacío para un nuevo plan
        actionUrl: '/admin/subscription-plans',
        formMethod: 'POST',
        messages: req.flash()
    });
};

// Crear un nuevo plan de suscripción
export const createSubscriptionPlan = async (req, res) => {
    const { name, durationMonths, bonusMonths, price, isActive } = req.body;
    try {
        await prisma.subscriptionPlan.create({
            data: {
                name,
                durationMonths: parseInt(durationMonths, 10),
                bonusMonths: bonusMonths ? parseInt(bonusMonths, 10) : null,
                price: parseFloat(price),
                isActive: isActive === 'on' || isActive === true, // Checkbox o valor booleano
            }
        });
        req.flash('success_msg', 'Plan de suscripción creado exitosamente.');
        res.redirect('/admin/subscription-plans');
    } catch (error) {
        console.error("Error creating subscription plan:", error);
        req.flash('error_msg', 'Error al crear el plan. Asegúrate de que el nombre no esté duplicado si es único.');
        res.render('admin/subscription_plans/form', {
            title: 'Crear Nuevo Plan de Suscripción',
            plan: req.body, // Devolver los datos ingresados
            actionUrl: '/admin/subscription-plans',
            formMethod: 'POST',
            messages: req.flash()
        });
    }
};

// Mostrar formulario para editar un plan existente
export const renderEditSubscriptionPlanForm = async (req, res) => {
    const { id } = req.params;
    try {
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id }
        });
        if (!plan) {
            req.flash('error_msg', 'Plan de suscripción no encontrado.');
            return res.redirect('/admin/subscription-plans');
        }
        res.render('admin/subscription_plans/form', {
            title: `Editar Plan: ${plan.name}`,
            plan,
            actionUrl: `/admin/subscription-plans/${id}?_method=PUT`, // Para method-override
            formMethod: 'POST', // El formulario HTML siempre es POST, _method lo cambia
            messages: req.flash()
        });
    } catch (error) {
        console.error("Error fetching subscription plan for edit:", error);
        req.flash('error_msg', 'Error al cargar el plan para editar.');
        res.redirect('/admin/subscription-plans');
    }
};

// Actualizar un plan de suscripción existente
export const updateSubscriptionPlan = async (req, res) => {
    const { id } = req.params;
    const { name, durationMonths, bonusMonths, price, isActive } = req.body;
    try {
        await prisma.subscriptionPlan.update({
            where: { id },
            data: {
                name,
                durationMonths: parseInt(durationMonths, 10),
                bonusMonths: bonusMonths ? parseInt(bonusMonths, 10) : null,
                price: parseFloat(price),
                isActive: isActive === 'on' || isActive === true,
            }
        });
        req.flash('success_msg', 'Plan de suscripción actualizado exitosamente.');
        res.redirect('/admin/subscription-plans');
    } catch (error) {
        console.error("Error updating subscription plan:", error);
        req.flash('error_msg', 'Error al actualizar el plan.');
        // Re-render form con datos y error
        const plan = { ...req.body, id }; // Reconstruir el objeto plan para el formulario
        res.render('admin/subscription_plans/form', {
            title: `Editar Plan: ${plan.name || 'Error'}`,
            plan,
            actionUrl: `/admin/subscription-plans/${id}?_method=PUT`,
            formMethod: 'POST',
            messages: req.flash()
        });
    }
};

// Cambiar el estado activo/inactivo de un plan
export const toggleSubscriptionPlanStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
        if (!plan) {
            req.flash('error_msg', 'Plan no encontrado.');
            return res.redirect('/admin/subscription-plans');
        }
        await prisma.subscriptionPlan.update({
            where: { id },
            data: { isActive: !plan.isActive }
        });
        req.flash('success_msg', `Estado del plan "${plan.name}" cambiado exitosamente.`);
        res.redirect('/admin/subscription-plans');
    } catch (error) {
        console.error("Error toggling plan status:", error);
        req.flash('error_msg', 'Error al cambiar el estado del plan.');
        res.redirect('/admin/subscription-plans');
    }
};
