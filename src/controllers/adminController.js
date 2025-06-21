import prisma from '../lib/prisma.js';
import fs from 'fs/promises'; // Para operaciones de sistema de archivos (eliminar imagen antigua)
import path from 'path'; // Para construir rutas de archivo
import sanitizeHtml from 'sanitize-html'; // Importar sanitize-html
import { fileURLToPath } from 'url'; // Para __dirname en ES Modules

// Helper para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper para generar slugs (copiado de tagController.js, considerar mover a utils)
const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Reemplazar espacios con -
    .replace(/[^\w-]+/g, '')       // Remover caracteres no alfanuméricos excepto -
    .replace(/--+/g, '-')         // Reemplazar múltiples - con uno solo
    .replace(/^-+/, '')             // Quitar - del inicio
    .replace(/-+$/, '');            // Quitar - del final
};

const courseLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const courseStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

// === CRUD de Cursos ===

// List all courses for the admin panel
export const listAdminCourses = async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.render('admin/courses/index', { 
            courses, 
            messages: req.flash(),
            layout: 'layouts/main'
        });
    } catch (error) {
        console.error("Error fetching courses for admin:", error);
        req.flash('error_msg', 'Error al cargar los cursos.');
        res.redirect('/admin/courses');
    }
};

// Render the form to create a new course
export const renderCreateCourseForm = async (req, res) => {
    try {
        const allTags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
        res.render('admin/courses/form', {
            course: {}, // Objeto vacío para un nuevo curso
            actionUrl: '/admin/courses',
            formTitle: 'Crear Nuevo Curso',
            messages: req.flash(),
            allTags,
            courseLevels, // Pasando los enums/arrays definidos arriba
            courseStatuses,
            layout: 'layouts/main'
        });
    } catch (error) {
        console.error("Error fetching data for create course form:", error);
        req.flash('error_msg', 'Error al cargar el formulario de creación de curso.');
        res.redirect('/admin/courses');
    }
};

// Handle the creation of a new course
export const createCourse = async (req, res) => {
    const { 
        title, shortDescription, description,
        level, status, tags,
        durationMonths, studyDaysPerWeek, studyHoursPerDay,
        additionalMaterialInfo, requirements,
        aiSystemPrompt, 
        n8nWebhookUrl 
    } = req.body;

    const slug = generateSlug(title);
    let finalImageUrl = null;

    if (req.file) {
      // Construir la ruta relativa a la carpeta public
      // __dirname en ES Modules se refiere al directorio del archivo actual (src/controllers)
      const publicDir = path.resolve(__dirname, '../../public');
      finalImageUrl = path.relative(publicDir, req.file.path).replace(/\\/g, '/');
    }

    // Convertir precios y números, manejando valores vacíos o nulos
    const data = {
        title,
        slug,
        shortDescription: shortDescription || null,
        description: description ? sanitizeHtml(description, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'u', 's', 'img', 'figure', 'figcaption', 'iframe', 'div', 'span', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td' ]),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: [ 'src', 'alt', 'title', 'width', 'height', 'style', 'class' ],
            iframe: [ 'src', 'width', 'height', 'frameborder', 'allowfullscreen', 'title', 'class' ],
            a: [ 'href', 'name', 'target', 'title', 'class' ],
            table: ['class', 'style', 'width', 'border', 'cellpadding', 'cellspacing'],
            td: ['colspan', 'rowspan', 'class', 'style'],
            th: ['colspan', 'rowspan', 'class', 'style'],
            '*': [ 'style', 'class', 'id' ]
          },
          allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com'],
          parser: {
            lowerCaseTags: true 
          }
        }) : null,
        imageUrl: finalImageUrl, // Usar la ruta del archivo subido
        level: level || 'BEGINNER',
        status: status || 'DRAFT',
        durationMonths: durationMonths ? parseInt(durationMonths, 10) : null,
        studyDaysPerWeek: studyDaysPerWeek ? parseInt(studyDaysPerWeek, 10) : null,
        studyHoursPerDay: studyHoursPerDay ? parseFloat(studyHoursPerDay) : null,
        additionalMaterialInfo: additionalMaterialInfo || null,
        requirements: requirements || null, 
        aiSystemPrompt: aiSystemPrompt || null,
        n8nWebhookUrl: n8nWebhookUrl || null, 
    };

    // Manejar tags
    if (tags && Array.isArray(tags)) {
        data.tags = { connect: tags.map(tagId => ({ id: tagId })) };
    } else if (tags) { // Si solo viene un tag (no como array)
        data.tags = { connect: [{ id: tags }] };
    }


    try {
        const newCourse = await prisma.course.create({ data });

        // Crear un Quiz principal para el nuevo curso
        await prisma.quiz.create({
          data: {
            title: `Cuestionario Principal - ${newCourse.title}`,
            description: `Cuestionario principal para el curso ${newCourse.title}. Las preguntas se gestionan desde cada lección.`,
            quizType: 'KNOWLEDGE_CHECK', // O un tipo por defecto que prefieras
            courseId: newCourse.id,
          }
        });
        
        req.flash('success_msg', 'Curso y cuestionario principal creados exitosamente.');
        res.redirect('/admin/courses');
    } catch (error) {
        console.error("Error creating course:", error);
        const error_msg_text = error.code === 'P2002' && error.meta?.target?.includes('slug') 
            ? `Error: Ya existe un curso con el slug generado para "${title}". Intente con un título ligeramente diferente.`
            : error.code === 'P2002' && error.meta?.target?.includes('title')
            ? `Error: Ya existe un curso con el título "${title}".`
            : 'Error al crear el curso.';
        req.flash('error_msg', error_msg_text);
        
        const allTags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
        res.render('admin/courses/form', {
            course: req.body, // Devolver los datos ingresados
            actionUrl: '/admin/courses',
            formTitle: 'Crear Nuevo Curso',
            messages: req.flash(),
            error_msg: error_msg_text, // Para mostrar el error específico
            allTags,
            courseLevels,
            courseStatuses,
            layout: 'layouts/main'
        });
    }
};

// Render the form to edit an existing course
export const renderEditCourseForm = async (req, res) => {
    const { id } = req.params;
    try {
        const course = await prisma.course.findUnique({ 
            where: { id },
            include: { 
                tags: true,
                lessons: { // Incluir las lecciones asociadas al curso
                    orderBy: { order: 'asc' }
                },
                quizzes: { // Incluir los cuestionarios asociados al curso
                    orderBy: { createdAt: 'asc' },
                    include: {
                        questions: { // Incluir las preguntas de cada cuestionario
                            orderBy: { order: 'asc' } // Opcional: ordenar las preguntas
                        },
                        _count: { // Mantener el conteo si se usa en otro lugar
                            select: { questions: true }
                        }
                    }
                }
            } 
        });
        if (!course) {
            req.flash('error_msg', 'Curso no encontrado.');
            return res.redirect('/admin/courses');
        }
        const allTags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });

        // Calcular total de tokens usados para este curso
        const tokenUsage = await prisma.userCourseTokenLog.aggregate({
            _sum: { tokensUsed: true },
            where: { courseId: id },
        });
        const totalTokensUsed = tokenUsage._sum.tokensUsed || 0;

        res.render('admin/courses/form', {
            course,
            actionUrl: `/admin/courses/${id}?_method=PUT`,
            formTitle: 'Editar Curso',
            messages: req.flash(),
            allTags,
            courseLevels,
            courseStatuses,
            totalTokensUsed, // <--- Pasar totalTokensUsed
            layout: 'layouts/main'
        });
    } catch (error) {
        console.error("Error fetching course for edit:", error);
        req.flash('error_msg', 'Error al cargar el curso para editar.');
        res.redirect('/admin/courses');
    }
};

// Handle the update of an existing course
export const updateCourse = async (req, res) => {
    const { id } = req.params;
    const { 
        title, shortDescription, description,
        level, status, tags,
        durationMonths, studyDaysPerWeek, studyHoursPerDay,
        additionalMaterialInfo, requirements,
        aiSystemPrompt, 
        n8nWebhookUrl, 
        currentImageUrl 
    } = req.body;
    
    let finalImageUrl = currentImageUrl || null;

    if (req.file) {
      // Nueva imagen subida, eliminar la antigua si existe y es local (no una URL externa)
      if (currentImageUrl && !currentImageUrl.startsWith('http') && !currentImageUrl.startsWith('/uploads/')) {
        // Si currentImageUrl no es una URL externa y tampoco parece una ruta ya procesada por nosotros (ej. /uploads/...)
        // Esto es una heurística, podría necesitar ajuste si las URLs guardadas tienen formatos variados.
        // La forma más segura es que currentImageUrl siempre sea la ruta relativa desde 'public' si es local.
      } else if (currentImageUrl && (currentImageUrl.startsWith('uploads/') || currentImageUrl.startsWith('/uploads/'))) {
        // Normalizar currentImageUrl para que no empiece con / si ya tiene uploads/
        const imagePathToDelete = currentImageUrl.startsWith('/') ? currentImageUrl.substring(1) : currentImageUrl;
        try {
          const publicDir = path.resolve(__dirname, '../../public');
          const oldImagePath = path.join(publicDir, imagePathToDelete);
          await fs.unlink(oldImagePath);
          console.log(`Imagen antigua eliminada: ${oldImagePath}`);
        } catch (err) {
          console.error(`Error al eliminar imagen antigua ${oldImagePath}:`, err.message);
        }
      }
      const publicDir = path.resolve(__dirname, '../../public');
      finalImageUrl = path.relative(publicDir, req.file.path).replace(/\\/g, '/');
    }
    
    // El slug no se actualiza automáticamente para evitar romper URLs.
    const data = {
        title,
        shortDescription: shortDescription || null,
        description: description ? sanitizeHtml(description, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'u', 's', 'img', 'figure', 'figcaption', 'iframe', 'div', 'span', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td' ]),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: [ 'src', 'alt', 'title', 'width', 'height', 'style', 'class' ],
            iframe: [ 'src', 'width', 'height', 'frameborder', 'allowfullscreen', 'title', 'class' ],
            a: [ 'href', 'name', 'target', 'title', 'class' ],
            table: ['class', 'style', 'width', 'border', 'cellpadding', 'cellspacing'],
            td: ['colspan', 'rowspan', 'class', 'style'],
            th: ['colspan', 'rowspan', 'class', 'style'],
            '*': [ 'style', 'class', 'id' ]
          },
          allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com'],
          parser: {
            lowerCaseTags: true
          }
        }) : null,
        imageUrl: finalImageUrl, // Usar la nueva URL o la actual si no se subió nueva
        level: level || 'BEGINNER',
        status: status || 'DRAFT',
        durationMonths: durationMonths ? parseInt(durationMonths, 10) : null,
        studyDaysPerWeek: studyDaysPerWeek ? parseInt(studyDaysPerWeek, 10) : null,
        studyHoursPerDay: studyHoursPerDay ? parseFloat(studyHoursPerDay) : null,
        additionalMaterialInfo: additionalMaterialInfo || null,
        requirements: requirements || null, 
        aiSystemPrompt: aiSystemPrompt || null,
        n8nWebhookUrl: n8nWebhookUrl || null, 
    };

    // Manejar tags: set sobrescribe las relaciones existentes
    if (tags && Array.isArray(tags)) {
        data.tags = { set: tags.map(tagId => ({ id: tagId })) };
    } else if (tags) { // Si solo viene un tag
        data.tags = { set: [{ id: tags }] };
    } else { // Si no se envía ningún tag, se desasocian todos
        data.tags = { set: [] };
    }

    try {
        await prisma.course.update({
            where: { id },
            data
        });
        req.flash('success_msg', 'Curso actualizado exitosamente.');
        res.redirect('/admin/courses');
    } catch (error) {
        console.error("Error updating course:", error);
        const error_msg_text = error.code === 'P2002' && error.meta?.target?.includes('title')
            ? `Error: Ya existe otro curso con el título "${title}".`
            : 'Error al actualizar el curso.';
        req.flash('error_msg', error_msg_text);

        const allTags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
        // Reconstruir el objeto course con los datos que se intentaron guardar
        const courseDataForForm = { ...req.body, id, tags: data.tags.set.map(t => ({id: t.id})) }; // Simplificado, idealmente cargar los objetos Tag completos

        res.render('admin/courses/form', {
            course: courseDataForForm,
            actionUrl: `/admin/courses/${id}?_method=PUT`,
            formTitle: 'Editar Curso',
            messages: req.flash(),
            error_msg: error_msg_text,
            allTags,
            courseLevels,
            courseStatuses,
            layout: 'layouts/main'
        });
    }
};

// Handle the deletion of a course
export const deleteCourse = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.course.delete({ where: { id } });
        req.flash('success_msg', 'Curso eliminado exitosamente.');
        res.redirect('/admin/courses');
    } catch (error) {
        console.error("Error deleting course:", error);
        req.flash('error_msg', 'Error al eliminar el curso.');
        res.redirect('/admin/courses');
    }
};

// === CRUD de Lecciones ===

// List all lessons for a specific course
export const listAdminLessons = async (req, res) => {
    const { courseId } = req.params;
    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });
        if (!course) {
            req.flash('error_msg', 'Curso no encontrado.');
            return res.redirect('/admin/courses');
        }
        const lessons = await prisma.lesson.findMany({
            where: { courseId: courseId },
            orderBy: { order: 'asc' }
        });
        res.render('admin/lessons/index', { 
            course, 
            lessons, 
            messages: req.flash(), 
            layout: 'layouts/main' 
        });
    } catch (error) {
        console.error(`Error fetching lessons for course ${courseId}:`, error);
        req.flash('error_msg', 'Error al cargar las lecciones del curso.');
        res.redirect(`/admin/courses`);
    }
};

// Render the form to create a new lesson for a specific course
export const renderCreateLessonForm = async (req, res) => {
    const { courseId } = req.params;
    try {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            req.flash('error_msg', 'Curso no encontrado.');
            return res.redirect('/admin/courses');
        }
        const lessonsInCourse = await prisma.lesson.count({ where: { courseId: courseId } });
        res.render('admin/lessons/form', { 
            course, 
            lesson: null, 
            actionUrl: `/admin/courses/${courseId}/lessons`, 
            formTitle: `Añadir Lección a "${course.title}"`, 
            lessonsCount: lessonsInCourse, // Para sugerir el siguiente número de orden
            messages: req.flash(), 
            layout: 'layouts/main' 
        });
    } catch (error) {
        console.error(`Error fetching course ${courseId} for new lesson form:`, error);
        req.flash('error_msg', 'Error al cargar el formulario para nueva lección.');
        res.redirect(`/admin/courses/${courseId}/lessons`);
    }
};

// === Generación de Curso con IA (Simulación) ===
export const generateCourseFromAI = async (req, res) => {
    const { aiPrompt } = req.body;

    if (!aiPrompt || typeof aiPrompt !== 'string' || aiPrompt.trim() === '') {
        return res.status(400).json({ error: 'El prompt para la IA es requerido y debe ser un texto no vacío.' });
    }

    try {
        // Simulación de llamada a una IA y procesamiento del prompt
        // En una implementación real, aquí llamarías a un servicio de IA (OpenAI, Gemini, etc.)
        console.log(`Prompt recibido para IA: "${aiPrompt}"`);

        // Simulación de respuesta de la IA
        const generatedTitle = `Curso sobre "${aiPrompt.substring(0, 30)}..." (IA)`;
        const generatedSlug = generateSlug(generatedTitle);
        
        const simulatedResponse = {
            title: generatedTitle,
            slug: generatedSlug, // El slug real se generaría al guardar el curso si el título cambia
            shortDescription: `Este es un curso generado por IA basado en tu prompt: "${aiPrompt.substring(0, 50)}...". Cubre los aspectos fundamentales y te prepara para...`,
            description: `<p>Contenido detallado generado por IA para el curso sobre <strong>${aiPrompt}</strong>.</p><p>Este curso explorará:</p><ul><li>Aspecto 1</li><li>Aspecto 2</li><li>Aspecto 3</li></ul><p>Y mucho más contenido relevante y actualizado.</p>`,
            level: courseLevels[Math.floor(Math.random() * courseLevels.length)],
            status: 'DRAFT',
            durationMonths: Math.floor(Math.random() * 3) + 1, // 1-3 meses
            studyDaysPerWeek: Math.floor(Math.random() * 3) + 3, // 3-5 días
            studyHoursPerDay: (Math.random() * 1.5 + 1).toFixed(1), // 1-2.5 horas
            additionalMaterialInfo: `Material de apoyo generado por IA para "${aiPrompt.substring(0, 20)}...": \n- Acceso a sandbox de pruebas.\n- Documentación complementaria.`,
            aiSystemPrompt: `Eres un asistente experto y amigable para el curso sobre "${aiPrompt.substring(0, 20)}...".`,
            aiModelName: 'simulated-teacher-v2',
            aiTemperature: 0.7,
            aiMaxTokensResponse: 1500,
            tags: [], 
            lessons: [
                { title: `Lección 1: Introducción a ${aiPrompt.substring(0, 20)}...`, content: `<p>Contenido de la lección 1 generado por IA sobre ${aiPrompt}.</p>`, order: 1 },
                { title: `Lección 2: Conceptos Clave de ${aiPrompt.substring(0, 20)}...`, content: `<p>Contenido de la lección 2 generado por IA sobre ${aiPrompt}.</p>`, order: 2 },
                { title: `Lección 3: Aplicaciones Prácticas de ${aiPrompt.substring(0, 20)}...`, content: `<p>Contenido de la lección 3 generado por IA.</p>`, order: 3 },
            ]
        };

        // Enviar la respuesta simulada
        res.status(200).json(simulatedResponse);

    } catch (error) {
        console.error("Error en la simulación de generación con IA:", error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor al generar el contenido con IA.' });
    }
};

// Handle the creation of a new lesson
export const createLesson = async (req, res) => {
    const { courseId } = req.params;
    const { 
        title, content, order
        // Ya no se reciben questionText, questionPoints, questionOptions desde el modal de lección
    } = req.body;

    const parsedOrder = parseInt(order, 10);
    if (isNaN(parsedOrder)) {
        return res.status(400).json({ message: 'El orden de la lección debe ser un número.' });
    }
    // Los campos de pregunta ya no vienen del modal de lección, se gestionarán en la pestaña Cuestionarios.
    // Solo creamos la lección aquí.
    try {
        const newLesson = await prisma.lesson.create({
            data: {
                title,
                content: sanitizeHtml(content, { /* ... opciones de sanitización ... */ }), // Asegúrate que sanitizeHtml esté definido o usa tus opciones
                order: parsedOrder,
                courseId: courseId
            }
        });

        // Ahora, crear una pregunta placeholder para esta lección en el Quiz principal del curso.
        const mainQuiz = await prisma.quiz.findFirst({
            where: { courseId: courseId },
            orderBy: { createdAt: 'asc' } // Asumimos que el más antiguo es el principal
        });

        if (mainQuiz) {
            await prisma.question.create({
                data: {
                    quizId: mainQuiz.id,
                    text: `Pregunta para Lección ${newLesson.order}: ${newLesson.title} (Editar aquí)`,
                    options: [{ text: "Opción A", isCorrect: false }, { text: "Opción B", isCorrect: false }], // Opciones placeholder
                    order: newLesson.order, // El orden de la pregunta coincide con el de la lección
                    points: 1,
                }
            });
            res.status(201).json({ message: 'Lección creada y pregunta placeholder asociada generada.', lesson: newLesson });
        } else {
            // Esto no debería suceder si createCourse siempre crea un Quiz principal.
            console.error(`Error crítico: No se encontró Quiz principal para el curso ${courseId} al crear la lección ${newLesson.id}.`);
            res.status(201).json({ message: 'Lección creada, pero no se pudo generar la pregunta asociada (Quiz principal no encontrado).', lesson: newLesson });
        }

    } catch (error) {
        console.error(`Error creating lesson for course ${courseId}:`, error);
        // Devolver JSON en caso de error también
        res.status(500).json({ message: 'Error al crear la lección.', error: error.message });
    }
};

// Render the form to edit an existing lesson
export const renderEditLessonForm = async (req, res) => {
    const { courseId, lessonId } = req.params;
    try {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            req.flash('error_msg', 'Curso no encontrado.');
            return res.redirect('/admin/courses');
        }
        const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
        if (!lesson || lesson.courseId !== courseId) {
            req.flash('error_msg', 'Lección no encontrada o no pertenece a este curso.');
            return res.redirect(`/admin/courses/${courseId}/lessons`);
        }
        res.render('admin/lessons/form', { 
            course, 
            lesson, 
            actionUrl: `/admin/courses/${courseId}/lessons/${lessonId}?_method=PUT`, 
            formTitle: `Editar Lección: "${lesson.title}"`, 
            messages: req.flash(), 
            layout: 'layouts/main' 
        });
    } catch (error) {
        console.error(`Error fetching lesson ${lessonId} for edit:`, error);
        req.flash('error_msg', 'Error al cargar la lección para editar.');
        res.redirect(`/admin/courses/${courseId}/lessons`);
    }
};

// Handle the update of an existing lesson (modified to return JSON)
export const updateLesson = async (req, res) => {
    const { courseId, lessonId } = req.params;
    const { 
        title, content, order
        // Ya no se reciben questionText, questionPoints, questionOptions desde el modal de lección
    } = req.body;

    if (!title || content === undefined || order === undefined || order === null) {
        return res.status(400).json({ message: 'Título, contenido y orden de la lección son requeridos.' });
    }
    const parsedOrder = parseInt(order, 10);
    if (isNaN(parsedOrder)) {
        return res.status(400).json({ message: 'El orden de la lección debe ser un número.' });
    }

    try {
        const lessonToUpdate = await prisma.lesson.findUnique({ where: { id: lessonId } });
        if (!lessonToUpdate || lessonToUpdate.courseId !== courseId) {
            return res.status(404).json({ message: 'Lección no encontrada o no pertenece a este curso.' });
        }

        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                title,
                content: sanitizeHtml(content, { /* ... opciones de sanitización ... */ }),
                order: parsedOrder,
            }
        });

        // La lógica para actualizar el contenido de la pregunta asociada se ha movido 
        // a la función updateQuestion y se gestiona desde la pestaña "Cuestionarios".
        // Aquí solo nos preocupamos por la lección en sí.
        // Si el orden de la lección cambia, la pregunta asociada (identificada por 'order')
        // mantendrá su 'order' original a menos que se implemente una lógica adicional para actualizarlo,
        // lo cual podría ser complejo si los órdenes se reasignan. Por ahora, se asume que el 'order'
        // de la pregunta se edita manualmente si es necesario desde la pestaña "Cuestionarios".

        res.json({ message: 'Lección actualizada exitosamente.', lesson: updatedLesson });
    } catch (error) {
        console.error(`Error updating lesson ${lessonId}:`, error);
        res.status(500).json({ message: 'Error al actualizar la lección.' });
    }
};

// Handle the deletion of a lesson (modified to return JSON)
export const deleteLesson = async (req, res) => {
    const { courseId, lessonId } = req.params; // courseId no es estrictamente necesario si lessonId es globalmente único
    try {
        const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
        if (!lesson) {
            return res.status(404).json({ message: 'Lección no encontrada.' });
        }
        // Opcional: Verificar que la lección pertenece al courseId si es necesario por seguridad.
        // if (lesson.courseId !== courseId) {
        //     return res.status(403).json({ message: 'Acceso denegado a esta lección.' });
        // }

        // Antes de eliminar la lección, eliminar la pregunta asociada
        const mainQuiz = await prisma.quiz.findFirst({
            where: { courseId: lesson.courseId }, // Usar lesson.courseId que ya tenemos
            orderBy: { createdAt: 'asc' }
        });

        if (mainQuiz) {
            await prisma.question.deleteMany({ // Usar deleteMany en caso de que, por error, haya múltiples preguntas con el mismo order
                where: {
                    quizId: mainQuiz.id,
                    order: lesson.order
                }
            });
        }

        await prisma.lesson.delete({ where: { id: lessonId } });
        res.json({ message: 'Lección y pregunta asociada eliminadas exitosamente.' });
    } catch (error) {
        console.error(`Error deleting lesson ${lessonId}:`, error);
        res.status(500).json({ message: 'Error al eliminar la lección.' });
    }
};

// Get Lesson Data as JSON (New function)
export const getLessonDataAsJson = async (req, res) => {
    const { courseId, lessonId } = req.params;
    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) {
            return res.status(404).json({ message: 'Lección no encontrada.' });
        }
        if (lesson.courseId !== courseId) {
            return res.status(403).json({ message: 'La lección no pertenece al curso especificado.' });
        }

        // Buscar la pregunta asociada a esta lección (asumiendo una pregunta por lección, vinculada por orden o una relación directa si se añade)
        // Por ahora, asumimos que el "Quiz Principal" es el único quiz del curso.
        const mainQuiz = await prisma.quiz.findFirst({
            where: { courseId: courseId }, // Podríamos añadir un campo "isMain" o buscar por un título específico si hay múltiples quizzes
            orderBy: { createdAt: 'asc' } // Tomar el más antiguo como principal si hay varios
        });

        let questionData = {
            questionText: '',
            questionPoints: 1,
            questionOptions: []
        };

        if (mainQuiz) {
            const associatedQuestion = await prisma.question.findFirst({
                where: {
                    quizId: mainQuiz.id,
                    // Aquí necesitamos una forma de vincular la pregunta a la lección.
                    // Si es por orden, y la lección tiene un campo 'order', la pregunta también debería tenerlo.
                    // O si la pregunta tiene un 'lessonId' directo.
                    // Por ahora, asumiremos que la pregunta tiene un campo 'text' que podría ser similar al título de la lección
                    // o un 'order' que coincide con lesson.order.
                    // Para una implementación robusta, Question debería tener un lessonId o un order único dentro del quiz.
                    // Asumamos que la pregunta se identifica por el 'order' de la lección.
                    order: lesson.order 
                }
            });
            if (associatedQuestion) {
                questionData.questionText = associatedQuestion.text;
                questionData.questionPoints = associatedQuestion.points;
                questionData.questionOptions = associatedQuestion.options; // Prisma devuelve JSON como objeto/array
            }
        }

        res.json({
            id: lesson.id,
            title: lesson.title,
            content: lesson.content,
            order: lesson.order,
            courseId: lesson.courseId,
            ...questionData // Añadir datos de la pregunta
        });
    } catch (error) {
        console.error(`Error fetching lesson data for lesson ${lessonId}:`, error);
        res.status(500).json({ message: 'Error al obtener los datos de la lección.' });
    }
};

// === CRUD de Cuestionarios (Quizzes) ===

// Obtener datos de un cuestionario específico para el modal de edición (JSON)
export const getQuizDataAsJson = async (req, res) => {
    const { courseId, quizId } = req.params;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
        });

        if (!quiz) {
            return res.status(404).json({ message: 'Cuestionario no encontrado.' });
        }
        // Asegurarse de que el cuestionario pertenece al curso
        if (quiz.courseId !== courseId) {
            return res.status(403).json({ message: 'El cuestionario no pertenece al curso especificado.' });
        }
        res.json(quiz);
    } catch (error) {
        console.error(`Error fetching quiz data for quiz ${quizId}:`, error);
        res.status(500).json({ message: 'Error al obtener los datos del cuestionario.' });
    }
};

// Crear un nuevo cuestionario para un curso (JSON response)
export const createQuiz = async (req, res) => {
    const { courseId } = req.params;
    const { title, description, quizType, passingScore, maxAttempts } = req.body;

    if (!title || !quizType) {
        return res.status(400).json({ message: 'El título y el tipo de cuestionario son requeridos.' });
    }

    try {
        const courseExists = await prisma.course.findUnique({ where: { id: courseId } });
        if (!courseExists) {
            return res.status(404).json({ message: 'Curso no encontrado.' });
        }

        const newQuiz = await prisma.quiz.create({
            data: {
                title,
                description: description || null,
                quizType,
                passingScore: passingScore ? parseInt(passingScore, 10) : null,
                maxAttempts: maxAttempts ? parseInt(maxAttempts, 10) : null,
                courseId: courseId,
            },
            // Incluir el conteo de preguntas para la respuesta, aunque será 0 inicialmente
            include: {
                _count: {
                    select: { questions: true }
                }
            }
        });
        res.status(201).json({ message: 'Cuestionario creado exitosamente.', quiz: newQuiz });
    } catch (error) {
        console.error(`Error creating quiz for course ${courseId}:`, error);
        res.status(500).json({ message: 'Error al crear el cuestionario.' });
    }
};

// Actualizar un cuestionario existente (JSON response)
export const updateQuiz = async (req, res) => {
    const { courseId, quizId } = req.params;
    const { title, description, quizType, passingScore, maxAttempts } = req.body;

    if (!title || !quizType) {
        return res.status(400).json({ message: 'El título y el tipo de cuestionario son requeridos.' });
    }

    try {
        const quizToUpdate = await prisma.quiz.findUnique({ where: { id: quizId } });
        if (!quizToUpdate || quizToUpdate.courseId !== courseId) {
            return res.status(404).json({ message: 'Cuestionario no encontrado o no pertenece a este curso.' });
        }

        const updatedQuiz = await prisma.quiz.update({
            where: { id: quizId },
            data: {
                title,
                description: description || null,
                quizType,
                passingScore: passingScore ? parseInt(passingScore, 10) : null,
                maxAttempts: maxAttempts ? parseInt(maxAttempts, 10) : null,
            },
            include: { // Devolver el conteo de preguntas actualizado
                _count: {
                    select: { questions: true }
                }
            }
        });
        res.json({ message: 'Cuestionario actualizado exitosamente.', quiz: updatedQuiz });
    } catch (error) {
        console.error(`Error updating quiz ${quizId}:`, error);
        res.status(500).json({ message: 'Error al actualizar el cuestionario.' });
    }
};

// Eliminar un cuestionario (JSON response)
export const deleteQuiz = async (req, res) => {
    const { courseId, quizId } = req.params;
    try {
        const quizToDelete = await prisma.quiz.findUnique({ where: { id: quizId } });
        if (!quizToDelete || quizToDelete.courseId !== courseId) {
            return res.status(404).json({ message: 'Cuestionario no encontrado o no pertenece a este curso.' });
        }

        // Prisma se encargará de eliminar las preguntas en cascada si está configurado en el schema
        await prisma.quiz.delete({
            where: { id: quizId },
        });
        res.json({ message: 'Cuestionario eliminado exitosamente.' });
    } catch (error) {
        console.error(`Error deleting quiz ${quizId}:`, error);
        res.status(500).json({ message: 'Error al eliminar el cuestionario.' });
    }
};

// === CRUD de Preguntas (dentro de un Cuestionario) ===

// Actualizar una pregunta existente (JSON response)
// Esta función es la que se necesita para el modal de edición de preguntas en courses/form.ejs
export const updateQuestion = async (req, res) => {
    const { quizId, questionId } = req.params;
    const { text, points, options, order } = req.body; // 'order' viene del formulario, aunque no se edita, es bueno tenerlo

    if (!text || !points || !Array.isArray(options) || options.length === 0) {
        return res.status(400).json({ message: 'Texto, puntos y al menos una opción son requeridos para la pregunta.' });
    }
    if (!options.some(opt => opt.isCorrect === true || opt.isCorrect === 'true')) {
        return res.status(400).json({ message: 'Al menos una opción debe ser marcada como correcta.' });
    }

    const parsedPoints = parseInt(points, 10);
    if (isNaN(parsedPoints) || parsedPoints < 0) {
        return res.status(400).json({ message: 'Los puntos deben ser un número no negativo.' });
    }

    // Limpiar y validar opciones
    const cleanedOptions = options.map(opt => ({
        text: (opt.text || '').trim(),
        isCorrect: opt.isCorrect === true || opt.isCorrect === 'true' // Asegurar booleano
    })).filter(opt => opt.text !== ''); // Eliminar opciones vacías

    if (cleanedOptions.length === 0) {
        return res.status(400).json({ message: 'Debe proporcionar al menos una opción con texto.' });
    }
    if (!cleanedOptions.some(opt => opt.isCorrect)) {
        return res.status(400).json({ message: 'Al menos una opción válida debe ser marcada como correcta.' });
    }
    
    try {
        const questionToUpdate = await prisma.question.findUnique({ 
            where: { id: questionId },
            include: { quiz: true } // Incluir el quiz para verificar pertenencia
        });

        if (!questionToUpdate) {
            return res.status(404).json({ message: 'Pregunta no encontrada.' });
        }
        if (questionToUpdate.quizId !== quizId) {
            return res.status(403).json({ message: 'La pregunta no pertenece al cuestionario especificado.' });
        }

        const updatedQuestion = await prisma.question.update({
            where: { id: questionId },
            data: {
                text,
                points: parsedPoints,
                options: cleanedOptions, // Prisma maneja el JSON array
                // El 'order' de la pregunta no se actualiza aquí, ya que está ligado al orden de la lección.
                // Si se quisiera permitir reordenar preguntas independientemente de las lecciones, se necesitaría otra lógica.
            }
        });
        res.json({ message: 'Pregunta actualizada exitosamente.', question: updatedQuestion });
    } catch (error) {
        console.error(`Error updating question ${questionId}:`, error);
        if (error.code === 'P2002' && error.meta?.target?.includes('quizId_order')) {
             return res.status(400).json({ message: `Error: Ya existe una pregunta con el orden ${order} en este cuestionario.` });
        }
        res.status(500).json({ message: 'Error al actualizar la pregunta.', error: error.message });
    }
};
