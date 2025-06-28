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
    const userId = req.session.user.id;

    let courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: {
        tags: { select: { name: true } },
        _count: { select: { lessons: true } }, // Contar el total de lecciones
      },
    });

    // Si hay usuario, obtener su progreso para cada curso
    if (userId) {
      const userProgress = await prisma.userCourseProgress.findMany({
        where: { userId },
        select: { courseId: true, progressPercentage: true },
      });

      // Crear un mapa para búsqueda rápida de progreso
      const progressMap = new Map(userProgress.map(p => [p.courseId, p.progressPercentage]));

      // Añadir el progreso a cada curso
      courses = courses.map(course => ({
        ...course,
        progress: progressMap.get(course.id) || 0, // Default a 0 si no hay progreso
      }));
    }

    res.render('dashboard', { 
      title: 'Catálogo de Cursos',
      courses,
      user: req.session.user,
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

    // --- Lógica de Progreso del Usuario ---
    let userCourseProgress = null;
    let completedLessons = new Set(); // Usaremos un Set para búsqueda rápida O(1)

    if (req.session.user) {
      const userId = req.session.user.id;

      // 1. Obtener el progreso general del curso
      userCourseProgress = await prisma.userCourseProgress.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
      });

      // 2. Obtener todas las lecciones completadas por el usuario en este curso
      const completedLessonProgress = await prisma.userLessonProgress.findMany({
        where: {
          userId,
          courseId: course.id,
          status: 'COMPLETED',
        },
        select: { lessonId: true },
      });
      
      completedLessonProgress.forEach(p => completedLessons.add(p.lessonId));
    }
    // --- Fin Lógica de Progreso ---

    res.render('courseDetail', {
      title: course.title,
      course,
      user: req.session.user,
      hasActiveSubscription, // Pasar la variable de suscripción
      userCourseProgress, // Pasar el progreso del curso
      completedLessons, // Pasar el Set de lecciones completadas
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
    const userId = req.session.user ? req.session.user.id : null;
    
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

    // La verificación de la suscripción ahora es manejada exclusivamente por el middleware checkActiveSubscription.
    // No se necesita lógica de suscripción aquí.

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

    // Marcar la lección como iniciada si es la primera vez que se accede
    if (userId) {
      await prisma.userLessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: { status: 'STARTED' }, // Podríamos añadir un campo lastAccessedAt si quisiéramos
        create: {
          userId,
          lessonId,
          courseId: lesson.courseId,
          status: 'STARTED',
        },
      });
    }

    // Verificar si la lección actual está completada por el usuario
    let isCompleted = false;
    if (userId) {
      const lessonProgress = await prisma.userLessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });
      if (lessonProgress && lessonProgress.status === 'COMPLETED') {
        isCompleted = true;
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
      isCompleted, // Pasar el estado de completado a la vista
      courseProgressPercentage,
      quizAttemptsCount,
      lastQuizScoreValue,
      previousLesson,
      nextLesson,
      user: req.session.user,
      marked, // Pasar la función marked a la vista
      // El layout se determina automáticamente en main.ejs
      hideSidebar: true // Oculta el sidebar para dar más espacio a la lección
    });
  } catch (error) {
    console.error(`Error fetching lesson ${req.params.lessonId}:`, error);
    res.status(500).send('Error al cargar la lección');
  }
};

// @desc    Mark a lesson as complete for the user
// @route   POST /courses/:courseId/lessons/:lessonId/complete
// @access  Private
export const markLessonAsComplete = async (req, res) => {
  const { lessonId, courseId: courseParam } = req.params; // courseParam can be slug or ID
  const userId = req.session.user.id;

  try {
    // CRITICAL FIX: Find the course by slug/ID to get the actual ID
    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { id: courseParam },
          { slug: courseParam }
        ]
      },
      select: { id: true } // Solo necesitamos el ID
    });

    if (!course) {
      req.flash('error_msg', 'No se pudo encontrar el curso para actualizar el progreso.');
      return res.redirect('back');
    }
    const courseId = course.id; // Use the real course ID from now on

    // 1. Marcar la lección como completada
    await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { status: 'COMPLETED', completedAt: new Date() },
      create: {
        userId,
        lessonId,
        courseId,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // 2. Recalcular el progreso del curso
    const totalLessonsInCourse = await prisma.lesson.count({
      where: { courseId },
    });

    const completedLessonsCount = await prisma.userLessonProgress.count({
      where: { userId, courseId, status: 'COMPLETED' },
    });

    const progressPercentage = totalLessonsInCourse > 0
      ? (completedLessonsCount / totalLessonsInCourse) * 100
      : 0;

    // 3. Actualizar el progreso general del curso
    await prisma.userCourseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {
        progressPercentage: progressPercentage,
        completedLessons: completedLessonsCount,
        status: progressPercentage === 100 ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: progressPercentage === 100 ? new Date() : null,
      },
      create: {
        userId,
        courseId,
        progressPercentage: progressPercentage,
        completedLessons: completedLessonsCount,
        totalLessons: totalLessonsInCourse,
        status: progressPercentage === 100 ? 'COMPLETED' : 'IN_PROGRESS',
      },
    });

    // 4. Encontrar la siguiente lección para redirigir
    const currentLesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    const nextLesson = await prisma.lesson.findFirst({
      where: {
        courseId,
        order: { gt: currentLesson.order },
      },
      orderBy: { order: 'asc' },
    });

    req.flash('success_msg', '¡Lección completada! Sigue así.');

    if (nextLesson) {
      // Use the original courseParam (slug or ID) for the redirect to maintain URL structure
      res.redirect(`/courses/${courseParam}/lessons/${nextLesson.id}`);
    } else {
      // Si no hay siguiente lección, es la última
      req.flash('success_msg', '¡Felicidades! Has completado todas las lecciones de este curso.');
      res.redirect(`/courses/${courseParam}`); // Redirigir a la página principal del curso
    }

  } catch (error) {
    console.error('Error marking lesson as complete:', error);
    req.flash('error_msg', 'Hubo un error al marcar la lección como completada.');
    res.redirect('back');
  }
};
