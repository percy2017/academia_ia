import express from 'express';
import dotenv from 'dotenv';
import expressEjsLayouts from 'express-ejs-layouts';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import prisma from './lib/prisma.js'; // Import Prisma client
import authRoutes from './routes/authRoutes.js'; // Import auth routes
import courseRoutes from './routes/courseRoutes.js'; // Import course routes
import userRoutes from './routes/userRoutes.js'; // Import user routes
import adminRoutes from './routes/adminRoutes.js'; // Import admin routes
import methodOverride from 'method-override'; // Import method-override
import flash from 'connect-flash'; // Import connect-flash
import { getAllCourses } from './controllers/courseController.js'; // Import getAllCourses
import { isAuthenticated } from './middleware/authMiddleware.js'; // Import isAuthenticated

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// View engine setup
app.use(expressEjsLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main'); // Default layout

// Static files middleware
app.use(express.static(path.join(__dirname, '../public')));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Method Override Middleware
app.use(methodOverride('_method'));

// Session configuration
const PgStore = connectPgSimple(session);
const sessionStore = new PgStore({
  prisma: prisma, // Use Prisma client for DB connection
  tableName: 'session', // Match @@map("session") in schema.prisma
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true, // Recommended for security
    // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
  }
}));

// Flash middleware - should be after session middleware
app.use(flash());

// Middleware to make session, user, current path, and flash messages available in all views
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.user = req.session.user; // Make user object directly available
  res.locals.currentPath = req.path; // Make current path available
  res.locals.messages = req.flash(); // Make flash messages available
  next();
});

// App Routes
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes); // Mount course routes
app.use('/admin', adminRoutes); // Mount admin routes
app.use('/', userRoutes); // Mount user routes (e.g., /profile)

// Root route - Now public and shows course catalog
// app.get('/', getAllCourses); // Uses getAllCourses, which renders 'dashboard.ejs' - Commented out old public route
app.get('/', isAuthenticated, getAllCourses); // Protect the root route

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
