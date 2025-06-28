import prisma from '../../lib/prisma.js';
import { sendEmail } from '../../lib/emailService.js';
import crypto from 'crypto';

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

// Ver detalles y progreso de un usuario
export const viewUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                subscriptions: {
                    where: { isActive: true },
                    include: { plan: true }
                }
            }
        });

        if (!user) {
            req.flash('error_msg', 'Usuario no encontrado.');
            return res.redirect('/admin/users');
        }

        const courseProgress = await prisma.userCourseProgress.findMany({
            where: { userId: id },
            include: {
                course: {
                    select: {
                        title: true,
                        slug: true
                    }
                }
            },
            orderBy: {
                course: {
                    title: 'asc'
                }
            }
        });

        // Re-usamos la vista de formulario, así que necesitamos los datos que espera
        const activePlans = await prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        const currentSubscription = user.subscriptions.length > 0 ? user.subscriptions[0] : null;

        res.render('admin/users/form', {
            user,
            courseProgress, // Pasamos el progreso del curso a la vista
            currentSubscription,
            activePlans,
            availableRoles,
            formTitle: `Viendo a ${user.name || user.email}`,
            actionUrl: `/admin/users/${user.id}?_method=PUT`,
            isViewMode: true, // Flag para diferenciar modo vista/edición
            messages: req.flash()
        });
    } catch (error) {
        console.error(`Error fetching user ${id} for view:`, error);
        req.flash('error_msg', 'Error al cargar la vista del usuario.');
        res.redirect('/admin/users');
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

// Reenviar correo de verificación desde el panel de admin
export const resendUserVerificationEmail = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) {
            req.flash('error_msg', 'Usuario no encontrado.');
            return res.redirect('/admin/users');
        }

        if (user.emailVerified) {
            req.flash('info_msg', `El correo de ${user.email} ya ha sido verificado.`);
            return res.redirect('/admin/users');
        }

        // Generar un nuevo token y actualizar el usuario
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerificationToken },
        });

        // Reenviar el correo de verificación
        const verificationUrl = `${req.protocol}://${req.get('host')}/auth/verify-email?token=${emailVerificationToken}`;
        const subject = 'Verificación de correo electrónico de Academia AI (enviado por un administrador)';
        const html = `
            <h1>Hola ${user.name},</h1>
            <p>Un administrador ha solicitado un nuevo enlace de verificación para tu cuenta en Academia AI. Por favor, haz clic en el siguiente enlace para verificar tu dirección de correo electrónico:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
            <br>
            <p>Si no esperabas esto, puedes ignorar este correo.</p>
            <p>El equipo de Academia AI</p>
        `;
        
        await sendEmail(user.email, subject, html);

        req.flash('success_msg', `Se ha enviado un nuevo correo de verificación a ${user.email}.`);
        res.redirect('/admin/users');

    } catch (error) {
        console.error(`Error al reenviar correo de verificación para el usuario ${id}:`, error);
        req.flash('error_msg', 'Error al intentar reenviar el correo.');
        res.redirect('/admin/users');
    }
};

// Eliminar un usuario
export const deleteUser = async (req, res) => {
    const { id } = req.params;

    // Medida de seguridad: no permitir que un admin se elimine a sí mismo.
    if (id === req.session.user.id) {
        req.flash('error_msg', 'No puedes eliminar tu propia cuenta de administrador.');
        return res.redirect('/admin/users');
    }

    try {
        const userToDelete = await prisma.user.findUnique({ where: { id } });
        if (!userToDelete) {
            req.flash('error_msg', 'Usuario no encontrado.');
            return res.redirect('/admin/users');
        }

        await prisma.user.delete({
            where: { id },
        });

        req.flash('success_msg', `El usuario ${userToDelete.email} ha sido eliminado exitosamente.`);
        res.redirect('/admin/users');
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        req.flash('error_msg', 'Error al eliminar el usuario.');
        res.redirect('/admin/users');
    }
};
