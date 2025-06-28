import express from 'express';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';
import { 
    listAdminCourses, 
    renderCreateCourseForm, 
    createCourse, 
    renderEditCourseForm, 
    updateCourse, 
    deleteCourse,
    // Controladores de lecciones
    listAdminLessons,
    renderCreateLessonForm as renderCreateLessonFormAdmin, // Alias para evitar colisión de nombres si se usa en otro contexto
    createLesson,
    renderEditLessonForm as renderEditLessonFormAdmin, // Alias
    updateLesson,
    deleteLesson,
    getLessonDataAsJson,
    // Controlador para generación IA
    generateCourseFromAI,
    testAiAgent, // Para probar la configuración del agente
    // Controladores de Cuestionarios (Quizzes)
    createQuiz,
    getQuizDataAsJson,
    updateQuiz,
    deleteQuiz,
    // Controlador de Preguntas
    updateQuestion
} from '../controllers/adminController.js';
import tagRoutes from './admin/tagRoutes.js'; // Importar rutas de tags
import userAdminRoutes from './admin/userAdminRoutes.js'; // Importar rutas de admin de usuarios
import subscriptionPlanAdminRoutes from './admin/subscriptionPlanAdminRoutes.js'; // Importar rutas de planes de suscripción
import subscriptionAdminRoutes from './admin/subscriptionAdminRoutes.js'; // Importar rutas de suscripciones
import mediaRoutes from './admin/mediaRoutes.js'; // Importar rutas de multimedia
import { uploadCourseImage } from '../middleware/uploadMiddleware.js'; // Importar middleware de subida para cursos

const router = express.Router();

// Prefijo /admin ya estará en server.js
router.get('/courses', isAuthenticated, isAdmin, listAdminCourses);
router.get('/courses/new', isAuthenticated, isAdmin, renderCreateCourseForm);
router.post('/courses', isAuthenticated, isAdmin, uploadCourseImage.single('courseImage'), createCourse); // Aplicar middleware
router.get('/courses/:id/edit', isAuthenticated, isAdmin, renderEditCourseForm);

// Para PUT y DELETE, consideraremos method-override más adelante.
// Por ahora, usaremos POST para simplificar si es necesario, o dejaremos PUT/DELETE si el cliente lo soporta (ej. AJAX).
// Si se usa method-override, el formulario HTML enviaría un POST a /courses/:id?_method=PUT (o DELETE)
router.put('/courses/:id', isAuthenticated, isAdmin, uploadCourseImage.single('courseImage'), updateCourse); // Aplicar middleware
router.delete('/courses/:id', isAuthenticated, isAdmin, deleteCourse);

import prisma from '../lib/prisma.js';

// Ruta para generación de contenido con IA
router.post('/courses/generate-from-ai', isAuthenticated, isAdmin, generateCourseFromAI);

// Ruta para probar la configuración del Agente IA
router.post('/courses/test-agent', isAuthenticated, isAdmin, testAiAgent);

// Rutas para CRUD de Lecciones (anidadas bajo cursos)
router.get('/courses/:courseId/lessons', isAuthenticated, isAdmin, listAdminLessons);
router.get('/courses/:courseId/lessons/new', isAuthenticated, isAdmin, renderCreateLessonFormAdmin);
router.post('/courses/:courseId/lessons', isAuthenticated, isAdmin, createLesson);
router.get('/courses/:courseId/lessons/:lessonId/edit', isAuthenticated, isAdmin, renderEditLessonFormAdmin);
router.get('/courses/:courseId/lessons/:lessonId/data', isAuthenticated, isAdmin, getLessonDataAsJson); // <--- Nueva ruta
router.put('/courses/:courseId/lessons/:lessonId', isAuthenticated, isAdmin, updateLesson);
router.delete('/courses/:courseId/lessons/:lessonId', isAuthenticated, isAdmin, deleteLesson);

// Montar rutas para CRUD de Tags
// El prefijo /admin ya está en server.js, aquí se añade /tags
// Todas las rutas dentro de tagRoutes estarán bajo /admin/tags
router.use('/tags', isAuthenticated, isAdmin, tagRoutes);

// Montar rutas para CRUD de Usuarios
// Todas las rutas dentro de userAdminRoutes estarán bajo /admin/users
router.use('/users', isAuthenticated, isAdmin, userAdminRoutes);

// Montar rutas para CRUD de Planes de Suscripción
// Todas las rutas dentro de subscriptionPlanAdminRoutes estarán bajo /admin/subscription-plans
router.use('/subscription-plans', isAuthenticated, isAdmin, subscriptionPlanAdminRoutes);

// Montar rutas para gestión de Suscripciones
router.use('/subscriptions', isAuthenticated, isAdmin, subscriptionAdminRoutes);

// Rutas para CRUD de Cuestionarios (Quizzes) anidadas bajo cursos
router.post('/courses/:courseId/quizzes', isAuthenticated, isAdmin, createQuiz);
router.get('/courses/:courseId/quizzes/:quizId/data', isAuthenticated, isAdmin, getQuizDataAsJson); // Ruta para obtener datos de un quiz
router.put('/courses/:courseId/quizzes/:quizId', isAuthenticated, isAdmin, updateQuiz);
router.delete('/courses/:courseId/quizzes/:quizId', isAuthenticated, isAdmin, deleteQuiz);

// Rutas para CRUD de Preguntas (anidadas bajo quizzes)
// La ruta que el frontend courses/form.ejs espera es /admin/quizzes/:quizId/questions/:questionId
// No necesita estar anidada bajo /courses/ en la definición de la ruta aquí, ya que el quizId es suficiente.
router.put('/quizzes/:quizId/questions/:questionId', isAuthenticated, isAdmin, updateQuestion);

// Montar rutas para CRUD de Multimedia
// Todas las rutas dentro de mediaRoutes estarán bajo /admin/media
router.use('/media', isAuthenticated, isAdmin, mediaRoutes);


export default router;
