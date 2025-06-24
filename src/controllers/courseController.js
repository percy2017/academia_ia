import prisma from '../lib/prisma.js';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

// Configuración de Marked (opcional pero recomendada)
marked.setOptions({
  renderer: new marked.Renderer(),
  pedantic: false,
  gfm: true,
  breaks: true, // Para que los saltos de línea simples se conviertan en <br>
  sanitize: false, // Desactivamos la sanitización de marked, usaremos sanitize-html después
  smartLists: true,
  smartypants: false,
  xhtml: false
});

// Función para sanitizar HTML de forma segura (puedes ajustar las opciones)
const sanitizeMarkdownOutput = (htmlContent) => {
  if (!htmlContent) return '';
  return sanitizeHtml(htmlContent, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'ul', 'ol', 'li', 'p', 'br', 'strong', 'em', 'a', 'code', 'pre', 'blockquote', 'hr' ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: [ 'href', 'name', 'target', 'title' ],
      img: [ 'src', 'alt', 'title' ]
    }
  });
};


// @desc    Get all courses for the dashboard
// @route   GET /courses/dashboard
// @access  Private
export const getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' }, // Mostrar solo cursos publicados en el dashboard público
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        tags: { // Incluir los tags asociados
          select: { name: true } // Solo necesitamos el nombre del tag para el dashboard
        } 
      }
    });
    res.render('dashboard', { 
      title: 'Catálogo de Cursos',
      courses,
      user: req.session.user
      // El layout se determina automáticamente en main.ejs
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).send('Error al cargar los cursos');
  }
};

// @desc    Get a single course by ID with its lessons
// @route   GET /courses/:courseId
// @access  Private
export const getCourseById = async (req, res) => {
  try {
    const { courseId: courseParam } = req.params; // Renombrar para claridad: puede ser slug o ID
    let course = await prisma.course.findUnique({
      where: { slug: courseParam },
      include: {
        lessons: {
          orderBy: {
            order: 'asc',
          },
        },
        tags: { // Incluir tags también en la vista de detalle del curso
          select: { name: true, slug: true } // Podríamos necesitar slug para enlaces de tags
        }
      },
    });

    if (!course) {
      // Si no se encuentra por slug, intentar por ID (verificar si es un CUID válido podría ser una mejora)
      // Prisma es indulgente y no fallará si courseParam no es un CUID para la búsqueda por ID, simplemente no encontrará nada.
      course = await prisma.course.findUnique({
        where: { id: courseParam },
        include: {
          lessons: {
            orderBy: {
              order: 'asc',
            },
          },
          tags: {
            select: { name: true, slug: true }
          }
        },
      });
    }

    if (!course) {
      return res.status(404).send('Curso no encontrado.');
    }

    // Si el curso no está publicado, solo los admins pueden verlo
    if (course.status !== 'PUBLISHED' && !(req.session.user && req.session.user.role === 'ADMIN')) {
      return res.status(404).send('Curso no encontrado o no disponible.');
    }

    // Convertir Markdown a HTML para los campos necesarios
    if (course.requirements) {
      course.requirementsHtml = sanitizeMarkdownOutput(marked.parse(course.requirements));
    }
    if (course.additionalMaterialInfo) {
      // Asumimos que additionalMaterialInfo también puede ser Markdown
      course.additionalMaterialInfoHtml = sanitizeMarkdownOutput(marked.parse(course.additionalMaterialInfo));
    }
    // La descripción principal ya se guarda como HTML sanitizado desde el adminController
    
    // --- Lógica de Suscripción ---
    let hasActiveSubscription = false;
    if (req.session.user) {
      const activeSubscription = await prisma.userSubscription.findFirst({
        where: {
          userId: req.session.user.id,
          isActive: true,
          endDate: {
            gte: new Date(), // Comprobar que la fecha de fin es hoy o en el futuro
          },
        },
      });
      hasActiveSubscription = !!activeSubscription;
    }
    // --- Fin Lógica de Suscripción ---

    res.render('courseDetail', {
      title: course.title,
      course,
      user: req.session.user,
      hasActiveSubscription // Pasar la nueva variable a la vista
      // El layout se determina automáticamente en main.ejs
    });
  } catch (error) {
    console.error(`Error fetching course ${req.params.courseId}:`, error);
    res.status(500).send('Error al cargar el curso');
  }
};

// @desc    Get a single lesson by ID
// @route   GET /courses/:courseId/lessons/:lessonId
// @access  Private
export const getLessonById = async (req, res) => {
  try {
    const { lessonId, courseId: courseParam } = req.params; // courseParam puede ser slug o ID
    
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: { // Incluir el curso al que pertenece la lección
          include: {
            lessons: { // Incluir TODAS las lecciones de ese curso
              orderBy: { order: 'asc' } // Ordenarlas
            }
          }
        }
      }
    });

    if (!lesson) {
      return res.status(404).send('Lección no encontrada.');
    }

    // Verificar que la lección pertenece al curso especificado por courseParam (slug o ID)
    if (lesson.course.slug !== courseParam && lesson.course.id !== courseParam) {
      return res.status(404).send('La lección no pertenece al curso especificado.');
    }

    // Verificar si el curso de la lección está publicado (o si es admin)
    if (lesson.course.status !== 'PUBLISHED' && !(req.session.user && req.session.user.role === 'ADMIN')) {
        return res.status(404).send('Lección no disponible.');
    }

    // --- Lógica de Suscripción para Acceso a Lecciones ---
    let hasActiveSubscription = false;
    if (req.session.user) {
      const activeSubscription = await prisma.userSubscription.findFirst({
        where: {
          userId: req.session.user.id,
          isActive: true,
          endDate: {
            gte: new Date(),
          },
        },
      });
      hasActiveSubscription = !!activeSubscription;
    }

    // Si el usuario no es ADMIN y no tiene suscripción activa, no puede ver la lección
    if (req.session.user?.role !== 'ADMIN' && !hasActiveSubscription) {
      req.flash('error_msg', 'Necesitas una suscripción activa para ver esta lección.');
      return res.redirect('/subscription-plans');
    }
    // --- Fin Lógica de Suscripción ---

    // Encontrar lección anterior y siguiente
    let previousLesson = null;
    let nextLesson = null;
    if (lesson.course && lesson.course.lessons) {
      const currentIndex = lesson.course.lessons.findIndex(l => l.id === lessonId);
      if (currentIndex > 0) {
        previousLesson = lesson.course.lessons[currentIndex - 1];
      }
      if (currentIndex < lesson.course.lessons.length - 1) {
        nextLesson = lesson.course.lessons[currentIndex + 1];
      }
    }

    let courseProgressPercentage = 0;
    let quizAttemptsCount = 0;
    let lastQuizScoreValue = 0;
    const currentUserId = req.session.user ? req.session.user.id : null;

    if (currentUserId) {
      // Fetch UserCourseProgress
      const userCourseProgress = await prisma.userCourseProgress.findUnique({
        where: {
          userId_courseId: {
            userId: currentUserId,
            courseId: lesson.courseId,
          },
        },
      });
      if (userCourseProgress) {
        courseProgressPercentage = userCourseProgress.progressPercentage;
      }

      // Fetch Quiz data - assuming the first quiz linked to the course is the main one
      const mainQuiz = await prisma.quiz.findFirst({
        where: { courseId: lesson.courseId },
        // orderBy: { createdAt: 'asc' }, // if there's a specific way to identify the main quiz, adjust here
      });

      if (mainQuiz) {
        // Fetch QuizAttempts count
        quizAttemptsCount = await prisma.quizAttempt.count({
          where: {
            userId: currentUserId,
            quizId: mainQuiz.id,
          },
        });

        // Fetch last QuizAttempt score
        const lastQuizAttempt = await prisma.quizAttempt.findFirst({
          where: {
            userId: currentUserId,
            quizId: mainQuiz.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        if (lastQuizAttempt) {
          lastQuizScoreValue = lastQuizAttempt.score;
        }
      }
    }

    res.render('lessonDetail', {
      title: `${lesson.course.title} - ${lesson.title}`,
      lesson,
      courseProgressPercentage,
      quizAttemptsCount,
      lastQuizScoreValue,
      previousLesson,
      nextLesson,
      user: req.session.user,
      marked, // Pasar la función marked a la vista
      // El layout se determina automáticamente en main.ejs
      hideMainSidebar: true // Esta variable sigue siendo útil para ocultar el sidebar en la vista de lección
    });
  } catch (error) {
    console.error(`Error fetching lesson ${req.params.lessonId}:`, error);
    res.status(500).send('Error al cargar la lección');
  }
};
