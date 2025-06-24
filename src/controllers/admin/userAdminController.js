import prisma from '../../lib/prisma.js';

const availableRoles = ['STUDENT', 'ADMIN']; // Roles disponibles para la edición

// Listar todos los usuarios
export const listUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.render('admin/users/index', {
            users,
            pageTitle: 'Administración de Usuarios', // Para el título de la página
            messages: req.flash()
        });
    } catch (error) {
        console.error("Error fetching users for admin:", error);
        req.flash('error_msg', 'Error al cargar los usuarios.');
        res.redirect('/admin'); // Redirigir a una página de admin general o dashboard
    }
};

// Mostrar formulario para editar usuario
export const renderEditUserForm = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                subscriptions: { // Incluir suscripciones del usuario
                    where: { isActive: true }, // Solo la activa
                    include: { plan: true } // Incluir detalles del plan asociado
                }
            }
        });

        if (!user) {
            req.flash('error_msg', 'Usuario no encontrado.');
            return res.redirect('/admin/users');
        }

        const activePlans = await prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });

        // El usuario puede tener como máximo una suscripción activa según este include.
        const currentSubscription = user.subscriptions.length > 0 ? user.subscriptions[0] : null;

        res.render('admin/users/form', {
            user,
            currentSubscription, // Pasar la suscripción actual
            activePlans,         // Pasar los planes activos para el select
            availableRoles,
            formTitle: `Editar Usuario: ${user.name || user.email}`,
            actionUrl: `/admin/users/${user.id}?_method=PUT`,
            messages: req.flash()
        });
    } catch (error) {
        console.error(`Error fetching user ${id} for edit:`, error);
        req.flash('error_msg', 'Error al cargar el usuario para editar.');
        res.redirect('/admin/users');
    }
};

// Asignar o actualizar la suscripción de un usuario
export const assignUserSubscription = async (req, res) => {
    const { userId } = req.params;
    const { planId, startDateString } = req.body; // startDate vendrá como string

    if (!planId || !startDateString) {
        req.flash('error_msg', 'Debe seleccionar un plan y una fecha de inicio.');
        return res.redirect(`/admin/users/${userId}/edit`);
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            req.flash('error_msg', 'Usuario no encontrado.');
            return res.redirect('/admin/users');
        }

        const selectedPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!selectedPlan || !selectedPlan.isActive) {
            req.flash('error_msg', 'Plan de suscripción no válido o inactivo.');
            return res.redirect(`/admin/users/${userId}/edit`);
        }

        const startDate = new Date(startDateString);
        if (isNaN(startDate.getTime())) {
            req.flash('error_msg', 'Fecha de inicio no válida.');
            return res.redirect(`/admin/users/${userId}/edit`);
        }

        const durationInMonths = selectedPlan.durationMonths + (selectedPlan.bonusMonths || 0);
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + durationInMonths);

        // Desactivar cualquier suscripción activa existente para este usuario
        await prisma.userSubscription.updateMany({
            where: {
                userId: userId,
                isActive: true,
            },
            data: {
                isActive: false,
                // Opcionalmente, podrías querer poner una fecha de fin a la suscripción antigua
                // endDate: new Date() // si la nueva suscripción la reemplaza inmediatamente
            },
        });

        // Crear la nueva suscripción
        await prisma.userSubscription.create({
            data: {
                userId: userId,
                planId: selectedPlan.id,
                startDate: startDate,
                endDate: endDate,
                isActive: true,
                paymentMethod: 'admin_grant', // Otorgada por admin
                isPaymentVerified: true, // Se asume verificada si es por admin
            },
        });

        req.flash('success_msg', `Suscripción al plan "${selectedPlan.name}" asignada exitosamente a ${user.email}.`);
        res.redirect(`/admin/users/${userId}/edit`);

    } catch (error) {
        console.error(`Error assigning subscription to user ${userId}:`, error);
        req.flash('error_msg', 'Error al asignar la suscripción.');
        res.redirect(`/admin/users/${userId}/edit`);
    }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { role, isActive } = req.body;

    // Convertir isActive a booleano (los checkboxes no envían 'false' si no están marcados)
    const userIsActive = isActive === 'on' || isActive === true || isActive === 'true';

    try {
        const userToUpdate = await prisma.user.findUnique({ where: { id } });
        if (!userToUpdate) {
            req.flash('error_msg', 'Usuario no encontrado.');
            return res.redirect('/admin/users');
        }

        // Evitar que un admin se quite el rol de ADMIN a sí mismo si es el único admin
        if (userToUpdate.email === req.user.email && userToUpdate.role === 'ADMIN' && role !== 'ADMIN') {
            const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
            if (adminCount <= 1) {
                req.flash('error_msg', 'No puedes quitarte el rol de Administrador si eres el único.');
                return res.redirect(`/admin/users/${id}/edit`);
            }
        }
        
        // Evitar que un admin se desactive a sí mismo si es el único admin activo
        if (userToUpdate.email === req.user.email && userToUpdate.role === 'ADMIN' && !userIsActive) {
             const activeAdminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
             if (activeAdminCount <=1) {
                req.flash('error_msg', 'No puedes desactivarte si eres el único Administrador activo.');
                return res.redirect(`/admin/users/${id}/edit`);
             }
        }


        await prisma.user.update({
            where: { id },
            data: {
                role: role, // Asegurarse que el rol es uno de los permitidos (STUDENT, ADMIN)
                isActive: userIsActive
            }
        });
        req.flash('success_msg', 'Usuario actualizado exitosamente.');
        res.redirect('/admin/users');
    } catch (error) {
        console.error(`Error updating user ${id}:`, error);
        req.flash('error_msg', 'Error al actualizar el usuario.');
        // Re-render form con error
        const user = await prisma.user.findUnique({ where: { id } }); // Recargar datos del usuario
        res.render('admin/users/form', {
            user: user || { id, name: 'Usuario Desconocido', email: 'desconocido@example.com' }, // Fallback si no se encuentra
            availableRoles,
            formTitle: `Editar Usuario: ${user ? (user.name || user.email) : id}`,
            actionUrl: `/admin/users/${id}?_method=PUT`,
            messages: req.flash() // Mostrar el error_msg que acabamos de poner
        });
    }
};
