import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import { sendEmail } from '../lib/emailService.js';
import crypto from 'crypto';

const SALT_ROUNDS = 10; // For bcrypt password hashing

export const renderRegisterForm = (req, res) => {
  res.render('auth/register', { 
    title: 'Registro - Academia AI',
    layout: false, // No usar layout global, register.ejs será HTML completo
    error: req.query.error 
  });
};

export const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body; // Añadir phone

  // Validación básica
  if (!name || !email || !password || !phone) {
    return res.redirect('/auth/register?error=Todos los campos son requeridos.');
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.redirect('/auth/register?error=Un usuario con este email ya existe.');
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'STUDENT', // Por defecto, los nuevos usuarios son STUDENT
        emailVerificationToken,
      },
    });

    // Enviar correo de verificación
    try {
      const verificationUrl = `${req.protocol}://${req.get('host')}/auth/verify-email?token=${emailVerificationToken}`;
      const subject = 'Verifica tu correo electrónico en Academia AI';
      const html = `
        <h1>Hola ${newUser.name},</h1>
        <p>Gracias por registrarte en Academia AI. Por favor, haz clic en el siguiente enlace para verificar tu dirección de correo electrónico:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <br>
        <p>Si no te registraste en nuestra plataforma, puedes ignorar este correo.</p>
        <p>El equipo de Academia AI</p>
      `;
      await sendEmail(newUser.email, subject, html);
    } catch (emailError) {
      // Si el correo falla, el registro debe considerarse fallido para no dejar usuarios sin verificar.
      // Opcionalmente, podrías borrar el usuario recién creado o marcarlo para reintentar.
      console.error(`Fallo al enviar el correo de verificación a ${newUser.email}:`, emailError);
      return res.redirect('/auth/register?error=No se pudo enviar el correo de verificación. Inténtalo de nuevo.');
    }

    // Redirigir a una página que informe al usuario que revise su email
    res.redirect('/auth/login?success_msg=Registro casi completo. Por favor, revisa tu correo para verificar tu cuenta.');
  } catch (error) {
    console.error('Error en el registro:', error);
    res.redirect('/auth/register?error=Error al registrar el usuario.');
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Token de verificación no proporcionado.');
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      return res.status(400).send('Token de verificación inválido o expirado.');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null, // Limpiar el token después de usarlo
      },
    });

    req.flash('success_msg', '¡Tu correo ha sido verificado! Ya puedes iniciar sesión.');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Error en la verificación de email:', error);
    res.status(500).send('Error al verificar el correo electrónico.');
  }
};

export const renderLoginForm = (req, res) => {
  // Pasamos cualquier mensaje de error o éxito desde los query params o flash messages
  // Por simplicidad ahora, usaremos req.query para errores básicos.
  // Una mejor solución a largo plazo sería usar connect-flash.
  res.render('auth/login', { 
    title: 'Login - Academia AI', 
    layout: false, // No usar layout global, login.ejs es HTML completo
    error: req.query.error, // Para mostrar errores como ?error=InvalidCredentials
    success_msg: req.query.success_msg // Para ?success_msg=RegisteredSuccessfully
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    // Redirigir de vuelta al login con un mensaje de error
    return res.redirect('/auth/login?error=Email y contraseña son requeridos.');
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.redirect('/auth/login?error=Email o contraseña inválidos.');
    }

    // Solo los estudiantes necesitan verificar su correo para iniciar sesión
    if (user.role === 'STUDENT' && !user.emailVerified) {
      return res.redirect('/auth/login?error=Debes verificar tu correo electrónico antes de iniciar sesión.');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.redirect('/auth/login?error=Email o contraseña inválidos.');
    }
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl, // Añadir avatarUrl a la sesión
    };
    // Redirigir a la raíz después de un login exitoso
    res.redirect('/'); 
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/auth/login?error=Error al iniciar sesión.');
  }
};

export const logoutUser = (req, res) => {
  // req.session.destroy((err) => {
  //   if (err) {
  //     console.error('Logout error:', err);
  //     return res.status(500).send('Error logging out.');
  //   }
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      // Aunque haya un error, intentamos redirigir
      return res.redirect('/'); // Redirigir a la home en caso de error de logout
    }
    res.clearCookie('connect.sid'); // Opcional: limpiar la cookie de sesión
    res.redirect('/auth/login'); // Redirigir a la página de login
  });
};
