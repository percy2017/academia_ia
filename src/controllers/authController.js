import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';

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
  if (!name || !email || !password) {
    return res.redirect('/auth/register?error=Todos los campos son requeridos.');
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.redirect('/auth/register?error=Un usuario con este email ya existe.');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null, // Guardar phone, o null si está vacío/undefined
        password: hashedPassword,
        role: 'STUDENT', // Por defecto, los nuevos usuarios son STUDENT
      },
    });

    // Redirigir a login con mensaje de éxito
    res.redirect('/auth/login?success_msg=Registro exitoso. Por favor, inicia sesión.');
  } catch (error) {
    console.error('Error en el registro:', error);
    res.redirect('/auth/register?error=Error al registrar el usuario.');
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
