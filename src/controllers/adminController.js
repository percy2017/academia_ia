import prisma from '../lib/prisma.js';
import { getAiResponse } from '../lib/aiService.js';
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
            messages: req.flash()
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
            courseStatuses
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
        aiProvider, aiModelName, aiApiKey, aiTemperature
    } = req.body;

    const slug = generateSlug(title);
    let finalImageUrl = null;

    if (req.file) {
      // Construir la ruta relativa a la carpeta public
      const publicDir = path.resolve(__dirname, '../../public');
      finalImageUrl = path.relative(publicDir, req.file.path).replace(/\\/g, '/');
    }

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
        imageUrl: finalImageUrl,
        level: level || 'BEGINNER',
        status: status || 'DRAFT',
        durationMonths: durationMonths ? parseInt(durationMonths, 10) : null,
        studyDaysPerWeek: studyDaysPerWeek ? parseInt(studyDaysPerWeek, 10) : null,
        studyHoursPerDay: studyHoursPerDay ? parseFloat(studyHoursPerDay) : null,
        additionalMaterialInfo: additionalMaterialInfo || null,
        requirements: requirements || null, 
        aiSystemPrompt: aiSystemPrompt || null,
        aiProvider: aiProvider || null,
        aiModelName: aiModelName || null,
        aiTemperature: aiTemperature ? parseFloat(aiTemperature) : null,
    };

    if (aiApiKey) {
        data.aiApiKey = aiApiKey;
    }

    if (tags && Array.isArray(tags)) {
        data.tags = { connect: tags.map(tagId => ({ id: tagId })) };
    } else if (tags) {
        data.tags = { connect: [{ id: tags }] };
    }

    try {
        const newCourse = await prisma.course.create({ data });
        await prisma.quiz.create({
          data: {
            title: `Cuestionario Principal - ${newCourse.title}`,
            description: `Cuestionario principal para el curso ${newCourse.title}. Las preguntas se gestionan desde cada lección.`,
            quizType: 'KNOWLEDGE_CHECK',
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
            course: req.body,
            actionUrl: '/admin/courses',
            formTitle: 'Crear Nuevo Curso',
            messages: req.flash(),
            error_msg: error_msg_text,
            allTags,
            courseLevels,
            courseStatuses
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
                lessons: { orderBy: { order: 'asc' } },
                quizzes: { include: { questions: { orderBy: { order: 'asc' } } } }
            }
        });

        if (!course) {
            req.flash('error_msg', 'Curso no encontrado.');
            return res.redirect('/admin/courses');
        }

        const allTags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
        const courses = await prisma.course.findMany({ orderBy: { title: 'asc' } });
        const questions = course.quizzes.flatMap(quiz => quiz.questions);
        // Asegurarse que mainQuiz siempre sea un objeto válido para la vista
        const mainQuiz = (course.quizzes && course.quizzes.length > 0) ? course.quizzes[0] : { questions: [] };
        
        res.render('admin/courses/form', {
            course,
            courses,
            lessons: course.lessons,
            quizzes: course.quizzes,
            questions,
            mainQuiz, // Ahora nunca es null
            allTags,
            courseLevels,
            courseStatuses,
            messages: req.flash(),
            formTitle: `Editar Curso: ${course.title}`,
            actionUrl: `/admin/courses/${course.id}?_method=PUT`
        });
    } catch (error) {
        console.error(`Error fetching course ${id} for edit:`, error);
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
        aiProvider, aiModelName, aiApiKey, aiTemperature,
        currentImageUrl,
        ollamaBaseUrl
    } = req.body;
    
    let finalImageUrl = currentImageUrl || null;

    if (req.file) {
      if (currentImageUrl && (currentImageUrl.startsWith('uploads/') || currentImageUrl.startsWith('/uploads/'))) {
        const imagePathToDelete = currentImageUrl.startsWith('/') ? currentImageUrl.substring(1) : currentImageUrl;
        try {
          const publicDir = path.resolve(__dirname, '../../public');
          const oldImagePath = path.join(publicDir, imagePathToDelete);
          await fs.unlink(oldImagePath);
        } catch (err) {
          console.error(`Error al eliminar imagen antigua ${oldImagePath}:`, err.message);
        }
      }
      const publicDir = path.resolve(__dirname, '../../public');
      finalImageUrl = path.relative(publicDir, req.file.path).replace(/\\/g, '/');
    }
    
    const dataToUpdate = {
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
        imageUrl: finalImageUrl,
        level: level || 'BEGINNER',
        status: status || 'DRAFT',
        durationMonths: durationMonths ? parseInt(durationMonths, 10) : null,
        studyDaysPerWeek: studyDaysPerWeek ? parseInt(studyDaysPerWeek, 10) : null,
        studyHoursPerDay: studyHoursPerDay ? parseFloat(studyHoursPerDay) : null,
        additionalMaterialInfo: additionalMaterialInfo || null,
        requirements: requirements || null, 
        aiSystemPrompt: aiSystemPrompt || null,
        aiProvider: aiProvider || null,
        aiModelName: aiModelName || null,
        aiTemperature: aiTemperature ? parseFloat(aiTemperature) : null,
    };

    if (description && description.startsWith('PROMPT: ')) {
        const aiPrompt = description.substring(8).trim();
        try {
            const courseConfig = {
                aiSystemPrompt,
                aiProvider,
                aiModelName,
                aiApiKey,
                aiTemperature,
                ollamaBaseUrl
            };
            dataToUpdate.description = await generateAiDescription(aiPrompt, description, courseConfig);
            dataToUpdate.description = dataToUpdate.description.replace('PROMPT: ', '');
        } catch (error) {
            console.error("Error generating AI description:", error);
            req.flash('error_msg', 'Error al generar la descripción con IA.');
        }
    }

    if (aiApiKey) {
        dataToUpdate.aiApiKey = aiApiKey;
    }

    if (tags && Array.isArray(tags)) {
        dataToUpdate.tags = { set: tags.map(tagId => ({ id: tagId })) };
    } else if (tags) {
        dataToUpdate.tags = { set: [{ id: tags }] };
    } else {
        dataToUpdate.tags = { set: [] };
    }

    try {
        await prisma.course.update({
            where: { id },
            data: dataToUpdate
        });
        req.flash('success_msg', 'Curso actualizado exitosamente.');
        res.redirect(`/admin/courses/${id}/edit`);
    } catch (error) {
        console.error("Error updating course:", error);
        const error_msg_text = error.code === 'P2002' && error.meta?.target?.includes('title')
            ? `Error: Ya existe otro curso con el título "${title}".`
            : 'Error al actualizar el curso.';
        req.flash('error_msg', error_msg_text);

        try {
            const allTags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
            const courseDataForForm = { 
                ...req.body, 
                id, 
                tags: await prisma.tag.findMany({ where: { id: { in: Array.isArray(tags) ? tags : [tags] } } })
            };

            res.render('admin/courses/edit/index', {
                course: courseDataForForm,
                messages: req.flash(),
                error_msg: error_msg_text,
                allTags,
                courseLevels,
                courseStatuses,
                lessons: [],
                quizzes: [],
                title: `Editar Curso: ${courseDataForForm.title}`
            });
        } catch (renderError) {
            console.error("Error rendering edit form after update failure:", renderError);
            res.redirect('/admin/courses');
        }
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

// Listar todas las lecciones de un curso específico para el panel de admin
export const listAdminLessons = async (req, res) => {
    const { courseId } = req.params;
    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { lessons: { orderBy: { order: 'asc' } } }
        });

        if (!course) {
            req.flash('error_msg', 'Curso no encontrado.');
            return res.redirect('/admin/courses');
        }

        res.render('admin/lessons/index', {
            course,
            lessons: course.lessons,
            messages: req.flash()
        });
    } catch (error) {
        console.error(`Error fetching lessons for course ${courseId}:`, error);
        req.flash('error_msg', 'Error al cargar las lecciones.');
        res.redirect(`/admin/courses/${courseId}/lessons`);
    }
};

// Renderizar el formulario para crear una nueva lección
export const renderCreateLessonForm = async (req, res) => {
    const { courseId } = req.params;
    try {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            req.flash('error_msg', 'Curso no encontrado.');
            return res.redirect('/admin/courses');
        }
        res.render('admin/lessons/form', {
            lesson: {},
            course,
            actionUrl: `/admin/courses/${courseId}/lessons`,
            formTitle: `Crear Nueva Lección para "${course.title}"`,
            messages: req.flash()
        });
    } catch (error) {
        console.error(`Error rendering create lesson form for course ${courseId}:`, error);
        req.flash('error_msg', 'Error al cargar el formulario.');
        res.redirect(`/admin/courses/${courseId}/lessons`);
    }
};

// Manejar la creación de una nueva lección
export const createLesson = async (req, res) => {
    const { courseId } = req.params;
    const { title, content, videoUrl, order } = req.body;
    const slug = generateSlug(title);

    try {
        const lastLesson = await prisma.lesson.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' }
        });
        const newOrder = lastLesson ? lastLesson.order + 1 : 1;

        await prisma.lesson.create({
            data: {
                title,
                slug,
                content: content ? sanitizeHtml(content) : null,
                videoUrl: videoUrl || null,
                order: order ? parseInt(order, 10) : newOrder,
                course: { connect: { id: courseId } }
            }
        });
        req.flash('success_msg', 'Lección creada exitosamente.');
        res.redirect(`/admin/courses/${courseId}/edit`);
    } catch (error) {
        console.error(`Error creating lesson for course ${courseId}:`, error);
        req.flash('error_msg', 'Error al crear la lección.');
        res.redirect(`/admin/courses/${courseId}/edit`);
    }
};

// Renderizar el formulario para editar una lección existente
export const renderEditLessonForm = async (req, res) => {
    const { courseId, lessonId } = req.params;
    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: true }
        });

        if (!lesson || lesson.courseId !== courseId) {
            req.flash('error_msg', 'Lección no encontrada.');
            return res.redirect(`/admin/courses/${courseId}/lessons`);
        }

        res.render('admin/lessons/form', {
            lesson,
            course: lesson.course,
            actionUrl: `/admin/courses/${courseId}/lessons/${lessonId}?_method=PUT`,
            formTitle: `Editar Lección: "${lesson.title}"`,
            messages: req.flash()
        });
    } catch (error) {
        console.error(`Error fetching lesson ${lessonId} for edit:`, error);
        req.flash('error_msg', 'Error al cargar la lección para editar.');
        res.redirect(`/admin/courses/${courseId}/lessons`);
    }
};

// Manejar la actualización de una lección existente
export const updateLesson = async (req, res) => {
    const { courseId, lessonId } = req.params;
    const { title, content, videoUrl, order } = req.body;

    try {
        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                title,
                content: content ? sanitizeHtml(content) : null,
                videoUrl: videoUrl || null,
                order: order ? parseInt(order, 10) : undefined,
            }
        });
        req.flash('success_msg', 'Lección actualizada exitosamente.');
        res.redirect(`/admin/courses/${courseId}/edit`);
    } catch (error) {
        console.error(`Error updating lesson ${lessonId}:`, error);
        req.flash('error_msg', 'Error al actualizar la lección.');
        res.redirect(`/admin/courses/${courseId}/lessons/${lessonId}/edit`);
    }
};

// Manejar la eliminación de una lección
export const deleteLesson = async (req, res) => {
    const { courseId, lessonId } = req.params;
    try {
        await prisma.lesson.delete({ where: { id: lessonId } });
        req.flash('success_msg', 'Lección eliminada exitosamente.');
        res.redirect(`/admin/courses/${courseId}/edit`);
    } catch (error) {
        console.error(`Error deleting lesson ${lessonId}:`, error);
        req.flash('error_msg', 'Error al eliminar la lección.');
        res.redirect(`/admin/courses/${courseId}/edit`);
    }
};

// Obtener datos de una lección como JSON
export const getLessonDataAsJson = async (req, res) => {
    const { lessonId } = req.params;
    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });
        if (!lesson) {
            return res.status(404).json({ error: 'Lección no encontrada' });
        }
        res.json(lesson);
    } catch (error) {
        console.error(`Error fetching lesson data for id ${lessonId}:`, error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Function to generate AI description
const generateAiDescription = async (prompt, currentDescription, courseConfig) => {
  try {
    const aiPrompt = `Genera una descripción del curso basada en el siguiente prompt: ${prompt}. La descripción actual del curso es: ${currentDescription}.`;
    const aiResponse = await getAiResponse(aiPrompt, [], courseConfig);
    return aiResponse;
  } catch (error) {
    console.error("Error generating AI description:", error);
    throw new Error("Error al generar la descripción con IA.");
  }
};

// === Generación de Contenido con IA ===

export const generateCourseFromAI = async (req, res) => {
    const { topic, targetAudience, learningObjectives, courseId } = req.body;
    
    try {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }

        const prompt = `
            Basado en los siguientes detalles, genera una estructura completa para un curso online.
            La estructura debe incluir un título para el curso, una descripción corta, una descripción detallada en formato HTML, y una lista de lecciones.
            Cada lección debe tener un título y un contenido detallado en formato HTML.
            El resultado debe ser un objeto JSON con las claves: "title", "shortDescription", "description", y "lessons".
            La clave "lessons" debe ser un array de objetos, donde cada objeto tiene "title" y "content".

            Detalles del curso:
            - Tema: ${topic}
            - Audiencia: ${targetAudience}
            - Objetivos de aprendizaje: ${learningObjectives}
        `;

        const aiResponseText = await getAiResponse(prompt, [], course);
        
        const jsonString = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiData = JSON.parse(jsonString);

        await prisma.course.update({
            where: { id: courseId },
            data: {
                title: aiData.title,
                shortDescription: aiData.shortDescription,
                description: sanitizeHtml(aiData.description),
                status: 'DRAFT'
            }
        });

        await prisma.lesson.deleteMany({ where: { courseId } });
        if (aiData.lessons && aiData.lessons.length > 0) {
            for (let i = 0; i < aiData.lessons.length; i++) {
                const lesson = aiData.lessons[i];
                await prisma.lesson.create({
                    data: {
                        title: lesson.title,
                        slug: generateSlug(lesson.title),
                        content: sanitizeHtml(lesson.content),
                        order: i + 1,
                        courseId: courseId
                    }
                });
            }
        }

        res.json({ 
            message: 'Curso y lecciones generados exitosamente.',
            redirectUrl: `/admin/courses/${courseId}/edit`
        });

    } catch (error) {
        console.error("Error generating course from AI:", error);
        res.status(500).json({ error: 'Error al generar el contenido del curso con IA.' });
    }
};

export const testAiAgent = async (req, res) => {
    const { courseId, testMessage } = req.body;
    try {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            return res.status(404).json({ error: 'Curso no encontrado.' });
        }
        
        const history = [{ role: 'user', parts: [{ text: testMessage }] }];
        const response = await getAiResponse(testMessage, history, course);

        res.json({
            message: 'Prueba exitosa',
            response: response
        });
    } catch (error) {
        console.error("Error testing AI agent:", error);
        res.status(500).json({ error: `Error al probar el agente de IA: ${error.message}` });
    }
};

// === CRUD de Cuestionarios (Quizzes) ===

export const createQuiz = async (req, res) => {
    const { courseId } = req.params;
    const { title, description, quizType } = req.body;

    try {
        const newQuiz = await prisma.quiz.create({
            data: {
                title,
                description: description || null,
                quizType: quizType || 'KNOWLEDGE_CHECK',
                courseId,
            },
        });
        res.status(201).json(newQuiz);
    } catch (error) {
        console.error('Error creating quiz:', error);
        res.status(500).json({ error: 'No se pudo crear el cuestionario.' });
    }
};

export const getQuizDataAsJson = async (req, res) => {
    const { quizId } = req.params;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: { questions: { orderBy: { order: 'asc' } } },
        });
        if (!quiz) {
            return res.status(404).json({ error: 'Cuestionario no encontrado.' });
        }
        res.json(quiz);
    } catch (error) {
        console.error(`Error fetching quiz data for id ${quizId}:`, error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

export const updateQuiz = async (req, res) => {
    const { quizId } = req.params;
    const { title, description, questions } = req.body;

    try {
        const transaction = [];

        transaction.push(
            prisma.quiz.update({
                where: { id: quizId },
                data: {
                    title,
                    description: description || null,
                },
            })
        );

        if (questions && Array.isArray(questions)) {
            const existingQuestions = await prisma.question.findMany({ where: { quizId } });
            const existingQuestionIds = existingQuestions.map(q => q.id);
            const incomingQuestionIds = questions.map(q => q.id).filter(id => id);

            const questionIdsToDelete = existingQuestionIds.filter(id => !incomingQuestionIds.includes(id));
            if (questionIdsToDelete.length > 0) {
                transaction.push(
                    prisma.question.deleteMany({
                        where: { id: { in: questionIdsToDelete } },
                    })
                );
            }

            for (const q of questions) {
                const questionData = {
                    text: q.text,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation || null,
                    order: q.order,
                    quizId: quizId,
                };

                if (q.id) {
                    transaction.push(
                        prisma.question.update({
                            where: { id: q.id },
                            data: questionData,
                        })
                    );
                } else {
                    transaction.push(
                        prisma.question.create({
                            data: questionData,
                        })
                    );
                }
            }
        }

        await prisma.$transaction(transaction);
        res.json({ message: 'Cuestionario actualizado exitosamente.' });

    } catch (error) {
        console.error(`Error updating quiz ${quizId}:`, error);
        res.status(500).json({ error: 'No se pudo actualizar el cuestionario.' });
    }
};

export const deleteQuiz = async (req, res) => {
    const { quizId } = req.params;
    try {
        await prisma.quiz.delete({ where: { id: quizId } });
        res.status(200).json({ message: 'Cuestionario eliminado exitosamente.' });
    } catch (error) {
        console.error(`Error deleting quiz ${quizId}:`, error);
        res.status(500).json({ error: 'No se pudo eliminar el cuestionario.' });
    }
};

// === CRUD de Preguntas ===
export const updateQuestion = async (req, res) => {
    const { questionId } = req.params;
    const { text, options, correctAnswer, explanation } = req.body;

    try {
        const updatedQuestion = await prisma.question.update({
            where: { id: questionId },
            data: {
                text,
                options,
                correctAnswer,
                explanation: explanation || null,
            },
        });
        res.json(updatedQuestion);
    } catch (error) {
        console.error(`Error updating question ${questionId}:`, error);
        res.status(500).json({ error: 'No se pudo actualizar la pregunta.' });
    }
};
