import express from 'express';
import http from 'http'; // Import http module
import { Server } from 'socket.io'; // Import Server from socket.io
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
import chatRoutes from './routes/chatRoutes.js'; // Import chat routes
import subscriptionRoutes from './routes/subscriptionRoutes.js'; // Import subscription routes
import methodOverride from 'method-override'; // Import method-override
import flash from 'connect-flash'; // Import connect-flash
import { getAllCourses } from './controllers/courseController.js'; // Import getAllCourses
import { isAuthenticated } from './middleware/authMiddleware.js'; // Import isAuthenticated
import socketHandler from './lib/socketHandler.js'; // Import socket handler

// Load environment variables
dotenv.config();

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server); // Initialize Socket.IO
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

const sessionMiddleware = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true, // Recommended for security
    // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
  }
});

// Use session middleware for Express
app.use(sessionMiddleware);

// Share session middleware with Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

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
app.use('/chat', chatRoutes); // Mount chat routes
app.use('/subscription-plans', subscriptionRoutes); // Mount subscription routes
app.use('/', userRoutes); // Mount user routes (e.g., /profile)

// Root route - Now public and shows course catalog
// app.get('/', getAllCourses); // Uses getAllCourses, which renders 'dashboard.ejs' - Commented out old public route
app.get('/', isAuthenticated, getAllCourses); // Protect the root route

// Initialize Socket.IO handler
socketHandler(io);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
