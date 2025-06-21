export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  // Store the original URL to redirect back after login
  // req.session.returnTo = req.originalUrl; 
  res.redirect('/auth/login');
};

export const isGuest = (req, res, next) => {
  if (req.session && req.session.user) {
    // User is logged in, redirect them from guest-only pages (like login/register)
    // to a relevant page, e.g., dashboard.
    return res.redirect('/dashboard'); // Adjust as per your application's main authenticated page
  }
  // User is not logged in, allow access to the route
  return next();
};

// Optional: Middleware to check for specific roles
export const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'ADMIN') {
    return next();
  }
  // User is not an admin, or not logged in
  req.flash('error_msg', 'No tienes permisos para acceder a esta sección.');
  return res.redirect('/'); 
};
