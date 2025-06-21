# System Prompt: Master Development Plan for AI-Powered E-Learning Platform

**Role:** You are an expert Full-Stack Developer specializing in the T3 Stack (Node.js, Express.js, PostgreSQL, Prisma, EJS). Your task is to act as a pair programmer, guiding me through the creation of a custom e-learning platform. I will provide you with the current phase of the project, and you will generate the necessary code, file structures, and explanations.

**Project Name:** "Academia AI"

**Core Technologies:**
*   **Backend:** Node.js with ES6 Modules (`"type": "module"` in `package.json`).
*   **Framework:** Express.js.
*   **Database:** PostgreSQL.
*   **ORM:** Prisma.
*   **Templating Engine:** EJS with `express-ejs-layouts`.
*   **Frontend Framework:** Bootstrap 5.
*   **Real-time Communication:** Socket.IO.
*   **Security:** `bcrypt` for password hashing, `express-session` with `connect-pg-simple` for session management.
*   **Development Environment:** Windows, VS Code, Nodemon for auto-reloading.
*   **Environment Variables:** `dotenv`.
*   **Markdown Processing:** `marked` (servidor), `easymde` (cliente).

---

## **Phase 0: Project Scaffolding and Environment Setup**

**Status: COMPLETED**

**Objective:** Initialize a robust and scalable project structure. Prepare all foundational configurations for our Express.js application.

**Instructions for AI:**
1.  Provide the complete `package.json` file content... ✅ Completado.
2.  Generate the full file and directory structure... ✅ Completado (implícitamente con la creación de archivos).
3.  Write the complete code for the main server entry point: `src/server.js`... ✅ Completado.
4.  Create the content for the base layout file `src/views/layouts/main.ejs`... ✅ Completado.
5.  Create placeholder files for the partials (`header.ejs`, `sidebar.ejs`) and the home view (`home.ejs`). ✅ Completado.
6.  Generate the content for the `.env.example` file... ✅ Completado.
7.  Generate a comprehensive `.gitignore` file... ✅ Completado.

---

## **Phase 1: Database Modeling and Secure User Authentication**

**Status: COMPLETADA (Revisada y Extendida)**

Objective: Implement a complete, secure user registration and login system. Modelar la base de datos para un sistema de e-learning basado en **suscripciones**, con seguimiento de progreso, quizzes, y configuración de IA por curso.

Instructions for AI:
1.  Provide the complete `prisma/schema.prisma` file... ✅ Completado y actualizado para el modelo de suscripción. Incluye:
    *   `User`, `Role`, `Session`, `Tag`.
    *   `Course` (sin precios individuales, con campos para material de apoyo y configuración de IA).
    *   `Lesson`.
    *   **Nuevos/Modificados:** `SubscriptionPlan`, `UserSubscription`, `UserLessonProgress`, `UserCourseProgress`, `Quiz`, `Question`, `QuizAttempt`, `UserCourseTokenLog`.
    *   **Eliminado:** `Enrollment`.
2.  Explain the command to run the initial database migration... ✅ Explicado. Se recomienda un reseteo de BD y `migrations/` para una única migración inicial con el nuevo esquema.
3.  Generate the code for the Prisma client singleton module (`src/lib/prisma.js`)... ✅ Estructura base creada.
4.  In `server.js`, write the code to configure `express-session`... ✅ Completado. Configurado para usar `connect-pg-simple` con `tableName: 'session'`.
5.  Generate the complete code for the authentication routes file: `src/routes/authRoutes.js`. ✅ Estructura base creada.
6.  Generate the complete code for the authentication controller: `src/controllers/authController.js`...
    *   `renderLoginForm`: ✅ Implementado, muestra `login.ejs` como HTML completo (sin layout de dashboard).
    *   `loginUser`: ✅ Lógica de inicio de sesión implementada (verifica credenciales, crea sesión, redirige a `/`).
    *   `logoutUser`: ✅ Lógica de cierre de sesión implementada.
    *   `renderRegisterForm`: ✅ Implementado, muestra `register.ejs` como HTML completo.
    *   `registerUser`: ✅ Lógica de registro de usuarios implementada (valida, hashea contraseña, crea usuario, redirige a login).
7.  Create the EJS views for registration (`register.ejs`) and login (`login.ejs`)...
    *   `login.ejs`: ✅ Creada como HTML completo, estilizada y funcional. Se unificó estilo con `register.ejs`.
    *   `register.ejs`: ✅ Creada como HTML completo, estilizada y funcional.
8.  Generate the code for two middleware functions in a new file `src/middleware/authMiddleware.js`... ✅ Estructura base creada (`isAuthenticated`, `isGuest`). La ruta raíz (`/`) ahora usa `isAuthenticated`.

---

## **Phase 2: Course and Lesson Content Structure (Adaptada a Suscripciones)**

**Status: COMPLETADA (Adaptada)**

Objective: Model and display the core educational content. Users with an active subscription can access all available courses and lessons.

Instructions for AI:
1.  Update the `prisma/schema.prisma` file to include `Course` and `Lesson` models, adaptados al modelo de suscripción. ✅ Completado.
    *   `Course`: `id`, `title` (@unique), `description`, `imageUrl`, `additionalMaterialInfo`, `requirements`, `aiSystemPrompt`, `aiModelName`, etc. (sin precios individuales).
    *   `Lesson`: `id`, `title`, `content` (String for HTML), `order` (Int), and a one-to-many relationship with `Course`.
    *   `Enrollment` (Junction Table): **Eliminada**. El acceso se gestiona mediante `UserSubscription`.
2.  Provide the Prisma CLI command for the new migration... ✅ Completado.
3.  Generate a seeding script `prisma/seed.js`... ✅ Completado y funcional, adaptado al nuevo esquema (crea planes de suscripción, un curso de Docker detallado con lecciones y preguntas, y una suscripción de ejemplo).
4.  Create `src/routes/courseRoutes.js` and `src/controllers/courseController.js`. ✅ Completado.
5.  Implement the controller logic for: ✅ Completado.
    *   `getAllCourses`: Fetches and renders all courses on a `/courses/dashboard` page. Protected by `isAuthenticated`.
    *   `getCourseById`: Fetches a single course and its lessons, renders `courseDetail.ejs`. (Actualizado para procesar Markdown de `requirements` y `additionalMaterialInfo`).
    *   `getLessonById`: Fetches a single lesson, renders `lessonDetail.ejs`.
6.  Create the EJS views: `dashboard.ejs`, `courseDetail.ejs`, `lessonDetail.ejs`. ✅ Completado. (Actualizado `courseDetail.ejs` para mostrar `requirementsHtml` y `additionalMaterialInfoHtml`).

---

## **Phase 3: AI Agent Integration (Simulación Inicial)**

**Objective:** Permitir a los alumnos interactuar con un Agente IA (profesor) para cada curso. Registrar el uso de tokens. (Socket.IO postergado para v1).

**Instructions for AI:** (Pendiente para v1)
1.  **Modelo `Course`:** Ya incluye campos para configuración de IA (`aiSystemPrompt`, `aiModelName`, etc.). ✅ Completado en Schema.
2.  **Modelo `UserCourseTokenLog`:** Para registrar el uso de tokens. ✅ Completado en Schema.
3.  **Ruta HTTP para IA:** Crear una ruta (ej. `POST /courses/:courseId/ask-ai`) que reciba la pregunta del alumno.
4.  **Controlador:** Lógica para:
    *   Usar la configuración de IA del curso.
    *   Simular una respuesta de la IA.
    *   Registrar el uso de tokens en `UserCourseTokenLog`.
    *   Devolver la respuesta al frontend.
5.  **Interfaz en `lessonDetail.ejs`:** Un formulario simple para enviar preguntas y mostrar respuestas.
*   (La integración con Socket.IO para tiempo real se considera para una versión posterior).

---

## **Phase 4: Administration Panel (Adaptado a Suscripciones y Nuevas Entidades)**

**Status: EN PROGRESO (Mayormente Completado)**

Objective: Expandir el panel de administración para gestionar el nuevo modelo de datos: Planes de Suscripción, Suscripciones de Usuarios, Quizzes, y configuraciones de Cursos.

**Desarrollo:**

*   **Middleware `isAdmin`:** Ya estaba implementado y se utiliza para proteger las rutas de administración.
*   **Rutas de Admin (`/admin/...`):** Estructura base creada y expandida para Cursos, Tags y ahora Usuarios.
*   **CRUD de Cursos y Lecciones:**
    *   **Mejoras en Formularios de Admin (Cursos, Lecciones, Tags):**
        *   Se estandarizó la UI de los formularios de creación/edición y las páginas de índice.
        *   Se implementó DataTables en las páginas de índice.
        *   Se añadió confirmación con SweetAlert2 para las acciones de eliminación.
    *   **Refactorización del Formulario de Administración de Cursos (`src/views/admin/courses/form.ejs`):**
        *   **Interfaz de Pestañas:** Implementada.
        *   **Pestaña "Detalles":**
            *   Consolida configuración general del curso.
            *   **NUEVO:** Campo `requirements` (String) añadido al modelo `Course` y al formulario.
            *   **NUEVO:** Campos `requirements` y `additionalMaterialInfo` ahora usan el editor Markdown **EasyMDE**.
        *   **Pestaña "Lecciones" Mejorada:**
            *   Listado con DataTables.
            *   Creación y Edición con Modal:
                *   **NUEVO:** El campo "Contenido" de la lección en el modal ahora usa el editor **Summernote**.
                *   Se eliminaron los campos de edición de preguntas del modal de lección para centralizar su gestión.
            *   Eliminación AJAX.
        *   **Backend para Lecciones (AJAX):**
            *   Funciones `createLesson`, `updateLesson`, `deleteLesson` en `adminController.js` devuelven JSON.
            *   Función `getLessonDataAsJson` implementada.
            *   Controladores `createLesson` y `updateLesson` ajustados para no esperar datos de preguntas desde el modal de lección.
        *   **Error de Linter en `courses/form.ejs`:** ✅ **Solucionado.** (Relacionado con la inicialización de `mainQuizData` y DataTables).
        *   **Error de DataTables (`_DT_CellIndex`):** ✅ **Solucionado.** (Asegurando que el `<tbody>` de `#questionsTable` esté vacío si no hay datos).
*   **Gestión de Cuestionarios y Preguntas (Fase C - Completada):**
    *   **Modelo Simplificado:** Un `Quiz` principal por curso, preguntas vinculadas a lecciones.
    *   **Creación Automática de Quiz Principal y Preguntas Placeholder:** ✅ Implementado en `adminController.js` (`createCourse`, `createLesson`, `deleteLesson`).
    *   **Pestaña "Cuestionarios" (`courses/form.ejs`):**
        *   Muestra información del `Quiz` principal.
        *   Lista `Question` existentes con DataTables.
        *   Modal (`questionModal`) para editar texto, opciones y puntos de cada pregunta.
    *   **Backend para Preguntas:**
        *   Función `updateQuestion` y ruta `PUT /admin/quizzes/:quizId/questions/:questionId` implementadas en `adminController.js` y `adminRoutes.js` respectivamente. ✅ **Completado.**
    *   **Schema (`prisma/schema.prisma`):** `@@unique([quizId, order])` en `Question`. ✅ Completado.
    *   **Seed (`prisma/seed.js`):** Actualizado para crear curso de Docker con lecciones, quiz principal y preguntas placeholder. ✅ **Completado y Refinado.**
*   **Gestión de Usuarios (Admin):** ✅ Completado (Modelo, Rutas, Controlador, Vistas).
*   **CRUD para `SubscriptionPlan`:** ✅ **Completado.**
*   **Asignar `UserSubscription` manualmente:** ✅ **Completado.**

**Pendiente para completar Fase 4 (Ejemplos):**
*   **Gestión de `UserSubscription`:**
    *   Ver las suscripciones de los usuarios.
    *   Verificar pagos manuales (para QR/transferencia) (ligado a flujo de pago).
*   **Visualización de Progreso:** Ver el progreso de los alumnos en cursos y lecciones.
*   **Visualización de Uso de Tokens IA:** Monitorizar el consumo de tokens por usuario/curso.
*   Dashboard principal del admin con resúmenes.

---

## **Phase 5: Definición Detallada de Cursos y Gestión de Tags (Integrada y Adaptada)**

**Status: COMPLETADA (Adaptada y Mejorada)**

Objective: Modelo `Course` y `Tag` robustos, alineados con el sistema de suscripción y las nuevas funcionalidades.

**Desarrollo:**
1.  **Actualización del Esquema Prisma (`prisma/schema.prisma`):**
    *   **Modelo `Course` Revisado:**
        *   Campos de precio eliminados.
        *   Nuevos campos: `additionalMaterialInfo`, `requirements`, `aiSystemPrompt`, `aiModelName`, `aiTemperature`, `aiMaxTokensResponse`. ✅ Completado.
    *   **Modelo `Tag`:** Sin cambios estructurales.
2.  **Migración de Base de Datos:** ✅ Completado.
3.  **CRUD de Tags para Administradores:** Funcionalidad existente se mantiene.
4.  **Actualización del Formulario de Cursos (Admin) (`src/views/admin/courses/form.ejs`):**
    *   Campos de precio eliminados.
    *   Añadidos campos para material de apoyo, requisitos y configuración de IA. ✅ Completado.
    *   Campos `requirements` y `additionalMaterialInfo` usan editor Markdown (EasyMDE). ✅ **Implementado.**
5.  **Actualización de Controladores de Cursos (Admin) (`src/controllers/adminController.js`):**
    *   Funciones `createCourse` y `updateCourse` adaptadas para manejar los nuevos campos, incluyendo `requirements`. ✅ Completado.
6.  **Actualización de Vistas Públicas (`courseController.js`, `courseDetail.ejs`):**
    *   Adaptadas para no mostrar precios individuales.
    *   `courseDetail.ejs` muestra `requirements` y `additionalMaterialInfo` procesados desde Markdown a HTML (usando `marked` en el backend). ✅ **Implementado.**
    *   **Pendiente:**
        *   Proteger el acceso basado en `UserSubscription` activa.
        *   Integrar la interfaz para el Agente IA (simulado inicialmente).
        *   Mostrar calendario de eventos/guía.
        *   Mostrar quizzes.
7.  **Configuración y Ejecución del Seeder (`prisma/seed.js`):**
    *   Actualizado para ser compatible con el nuevo esquema, incluyendo `requirements` y un curso de Docker más detallado. ✅ **Completado y Refinado.**

---

## **Nuevas Fases y Objetivos para la Primera Versión Completa (v1)**

*   **Fase A: Modelo de Suscripción, Acceso Base, Configuración de Cursos y Seguimiento de Progreso (Estructura)**
    *   **Schema Prisma:** ✅ Completado y Migrado.
    *   **Admin:** ✅ Mayormente Completado (CRUD Planes, Curso, Lecciones, Preguntas, Usuarios).
    *   **Lógica de Acceso:** Proteger cursos basado en `UserSubscription` activa. (Pendiente)

*   **Fase B: Funcionalidades del Curso (Contenido y Guías)**
    *   **Material de Apoyo y Requisitos:** ✅ Mostrados en `courseDetail.ejs` (procesando Markdown).
    *   **Calendario de Eventos (Guía):** Implementar lógica de presentación en `courseDetail.ejs`. (Pendiente)
    *   **Seguimiento de Progreso (Alumno):**
        *   Lógica para actualizar `UserLessonProgress` (ej. botón "Marcar como completada"). (Pendiente)
        *   Lógica para calcular y actualizar `UserCourseProgress`. (Pendiente)
        *   Mostrar progreso en el perfil del alumno/dashboard. (Pendiente)

*   **Fase C: Banco de Preguntas (Quizzes) - Estructura y Admin (Refactorizado)**
    *   **Admin:** ✅ **Completado.** (Creación automática de Quiz/Preguntas placeholder, edición de contenido de preguntas desde pestaña "Cuestionarios", ruta y controlador `updateQuestion` implementados).
    *   (Interfaz de alumno para tomar quizzes es para después de v1 o v1.x).

*   **Fase D: Agente IA (Simulación y Contador de Tokens) - Sin Tiempo Real**
    *   **Ruta HTTP y Controlador para IA Simulada:** (Pendiente)
    *   **Registro en `UserCourseTokenLog`:** (Pendiente)
    *   **Interfaz en `lessonDetail.ejs` para IA Simulada:** (Pendiente)

*   **Fase F: Asistente IA Interactivo con n8n (Integración Inicial y Evolución)**
    *   **Objetivo Inicial:** Integrar un chat en `lessonDetail.ejs` utilizando el widget `@n8n/chat` para conectar con un flujo de n8n que actúe como backend del asistente IA (MentorIA), utilizando Gemini como modelo de lenguaje y Postgres para la memoria del chat.
    *   **Desarrollo y Hallazgos:**
        *   ✅ **Configuración Inicial del Widget:** Se implementó el widget `@n8n/chat` en `lessonDetail.ejs`.
        *   ✅ **Envío de Contexto a n8n:**
            *   Se configuró el envío de `userId`, `courseId`, `lessonId` como parte del objeto `metadata`.
            *   Se implementó el envío de un `aiSystemPrompt` dinámico (definido por curso y con placeholders como `{{userName}}`, `{{userEmail}}`, `{{courseTitle}}`, `{{lessonTitle}}` reemplazados con datos reales).
            *   Se añadió el envío del contenido completo de `course.description`, `lesson.content`, `course.requirements`, y `course.additionalMaterialInfo` dentro de `metadata` para enriquecer el contexto de la IA.
            *   Se configuró el nodo "AI Agent" en n8n para utilizar el `aiSystemPrompt` dinámico y el contexto adicional recibido.
        *   ✅ **Memoria Persistente por Alumno en n8n:** Se configuró el nodo "Postgres Chat Memory" en n8n para usar el `metadata.userId` como "Key" (ID de sesión), logrando que el historial se guarde correctamente por alumno en la base de datos.
        *   ✅ **UI del Chat (Widget `@n8n/chat`):**
            *   Se implementó una UI flotante con un botón de activación.
            *   El encabezado del chat muestra dinámicamente el nombre del curso y la lección.
            *   Se ajustaron tamaños de fuente del encabezado mediante variables CSS.
            *   Se habilitó la subida de archivos (`allowFileUploads: true`), y se confirmó que n8n recibe la información del archivo.
        *   ⚠️ **Problemas Persistentes con `@n8n/chat`:**
            *   **Historial no se carga visualmente:** A pesar de que n8n recupera y guarda el historial correctamente, y la configuración del widget (`chatId: userId`, `loadPreviousSession: true`) parece correcta según la documentación, el historial de conversaciones anteriores no se muestra en la interfaz del widget.
            *   **`metadata` como `"[object Object]"` al enviar archivos:** Se observó que cuando se adjunta un archivo, el objeto `metadata` se envía a n8n como la cadena literal `"[object Object]"`, perdiendo todo el contexto. Se propuso como solución `JSON.stringify()` el objeto `metadata` en el frontend y `JSON.parse()` en n8n.
            *   **Limitaciones en la personalización de la UI:** Dificultades para ajustar finamente la apariencia (ej. tamaño de fuente de los mensajes) y el comportamiento del widget.
    *   **Decisión Estratégica:** Debido a los problemas persistentes con la carga del historial y la serialización de `metadata` al usar el widget `@n8n/chat`, y buscando un control total sobre la experiencia de usuario y la funcionalidad, **se ha decidido abandonar el uso del widget `@n8n/chat` para la interfaz de usuario.**
    *   **Próximo Paso Crítico:** **Desarrollar una interfaz de chat a medida** (frontend propio en `lessonDetail.ejs` o como componente EJS reutilizable). Esta UI personalizada se comunicará directamente con el webhook de n8n existente. n8n seguirá siendo el backend para la lógica del chat (agente, memoria, LLM).
        *   **Objetivos para la UI a Medida:**
            *   Enviar y recibir mensajes de texto.
            *   Mostrar correctamente el historial de chat por alumno.
            *   Permitir (opcionalmente) la subida de archivos (imágenes/audio).
            *   Enviar todo el contexto necesario (`userId`, `courseId`, `lessonId`, `aiSystemPrompt` procesado, contenido del curso/lección, requisitos, material adicional) a n8n de forma robusta.
            *   Tener control total sobre el diseño y la experiencia de usuario.

*   **Fase E: Gestión de Multimedia (Estilo WordPress)**
    *   **Objetivo:** Crear una interfaz de usuario en el panel de administración para subir, visualizar y gestionar archivos multimedia (imágenes, videos, PDFs, etc.) que puedan ser reutilizados en diferentes partes de la plataforma (ej. contenido de lecciones, imágenes destacadas de cursos, material de apoyo). La interfaz debería ser intuitiva, similar a la biblioteca de medios de WordPress.
    *   **Funcionalidades Clave (Propuesta Inicial):**
        *   Subida de archivos (individual y múltiple si es posible).
        *   Vista de galería/cuadrícula para los archivos subidos, con miniaturas.
        *   Filtrado y búsqueda de archivos (por nombre, tipo, fecha).
        *   Posibilidad de ver detalles del archivo (nombre, tipo, tamaño, fecha de subida, URL).
        *   Opción para copiar la URL del archivo.
        *   Opción para eliminar archivos (con confirmación).
        *   (Opcional avanzado) Edición básica de imágenes (recortar, rotar).
        *   (Opcional avanzado) Organización en carpetas.
    *   **Consideraciones Técnicas:**
        *   Modelo Prisma para `MediaFile` (id, filename, path, mimetype, size, userId (quién lo subió), createdAt).
        *   Middleware de subida (Multer) configurado para manejar diferentes tipos de archivo y almacenarlos en una ubicación designada (ej. `public/uploads/media`).
        *   Rutas y controladores específicos para la gestión de multimedia.
        *   Interfaz de usuario en el frontend (EJS, JavaScript) para interactuar con el backend.
    *   **Estado: COMPLETADA (Funcionalidad Base)**
    *   **Desarrollo:**
        *   **Modelo `MediaFile`:** ✅ Creado en `prisma/schema.prisma` (id, filename, path, mimetype, size, userId, createdAt, updatedAt). Migración aplicada.
        *   **Middleware de Subida (Multer):** ✅ Configurado en `src/middleware/mediaUploadMiddleware.js`. Permite subida múltiple (`upload.array('mediafiles', 10)`), filtrado de tipos de archivo y límite de tamaño configurable mediante la variable de entorno `MAX_FILE_SIZE_MB` (default 50MB). El archivo `.env.example` fue actualizado.
        *   **Rutas y Controlador:** ✅ Creados `src/routes/admin/mediaRoutes.js` (protegidas por `isAdmin`) y `src/controllers/admin/mediaController.js` con lógica para listar, subir (múltiples archivos) y eliminar archivos. Las rutas están integradas en `adminRoutes.js` bajo `/admin/media`.
        *   **Interfaz de Usuario (Admin):** ✅ Creada la vista `src/views/admin/media/index.ejs` que incluye:
            *   Formulario para subir múltiples archivos.   
            *   Visualización de archivos en formato de galería (tarjetas con vista previa para imágenes o iconos para otros tipos).
            *   Campo para copiar la URL completa del archivo.
            *   Botón de eliminación con confirmación (SweetAlert2).
            *   Enlace "Biblioteca Multimedia" añadido al menú lateral del panel de administración.
        *   **Correcciones:** Solucionados errores de path en `include` y `req is not defined` en la vista. Corregida la visualización de imágenes (rutas relativas a `public`).

*   **(Postergado para después de v1):** Integración completa de pasarelas de pago, Socket.IO para IA en tiempo real.

---

## **Ajustes y Correcciones Adicionales Implementadas (Recientes)**
*   **Editor Markdown para Campos de Curso:** Los campos "Requisitos" e "Información sobre Material Adicional" en el formulario de administración de cursos ahora utilizan el editor Markdown **EasyMDE**. El contenido se procesa con `marked` en el backend para su visualización en las vistas públicas. ✅ **Implementado.**
*   **Editor WYSIWYG para Contenido de Lecciones:** El campo "Contenido" en el modal de creación/edición de lecciones ahora utiliza el editor **Summernote**. ✅ **Implementado.**
*   **Flujo de Edición de Preguntas:** Se centralizó la edición del contenido de las preguntas en la pestaña "Cuestionarios" del formulario de curso, eliminando los campos de edición del modal de lección. ✅ **Implementado.**
*   **Corrección de Errores de Linter y DataTables:** Se solucionaron errores de JavaScript en `src/views/admin/courses/form.ejs` relacionados con la inicialización de datos y DataTables. ✅ **Solucionado.**
*   **Corrección Seeder:** Se solucionó `ReferenceError` en `prisma/seed.js` y se refinó el contenido del curso de Docker. ✅ **Solucionado.**
*   **Campo `requirements` en Curso:** Añadido al modelo `Course`, migraciones, formularios, controladores y vistas. ✅ **Implementado.**
*   **Ajustes en Visualización de Cursos (Frontend y Admin):**
    *   Eliminada la lógica de precios individuales y el texto "Gratis" de las vistas de catálogo (`dashboard.ejs`) y detalle del curso (`courseDetail.ejs`) para alinear con el modelo de suscripción.
    *   La descripción completa del curso en `courseDetail.ejs` ahora renderiza HTML correctamente (usando `<%- course.description %>`). Se debe asegurar la sanitización del HTML al guardarlo.
    *   La tabla de gestión de cursos en el panel de administración (`admin/courses/index.ejs`) ahora muestra la `shortDescription` en lugar de la descripción completa con HTML, mejorando la legibilidad.
*   **Configuración del Agente IA (Formulario de Curso Admin):**
    *   El modelo `Course` en `prisma/schema.prisma` fue modificado:
        *   ✅ Añadido el campo opcional `n8nWebhookUrl: String?`.
        *   ❌ Eliminados los campos `aiModelName`, `aiTemperature`, y `aiMaxTokensResponse`.
    *   Migración de base de datos aplicada para estos cambios.
    *   `adminController.js` actualizado para manejar `n8nWebhookUrl` (crear/actualizar) y para calcular y pasar el `totalTokensUsed` (sumando `UserCourseTokenLog`) a la vista de edición del curso.
    *   La pestaña "Agente IA" en `src/views/admin/courses/form.ejs` ahora incluye:
        *   Campo para `n8nWebhookUrl`.
        *   Visualización del `totalTokensUsed` (solo lectura).
        *   Campo para `aiSystemPrompt` (textarea).
        *   Eliminados los inputs para `aiModelName`, `aiTemperature`, y `aiMaxTokensResponse`.
        *   Nota informativa sobre el uso de placeholders en el `aiSystemPrompt`.
*   **Actualización Mayor del Seeder (`prisma/seed.js`):**
    *   ✅ Reescrito para incluir datos de producción detallados para 3 cursos (Docker, PHP, Python).
    *   Posteriormente, **extendido a 4 cursos**, añadiendo "JavaScript: El Alma Interactiva de la Web". Cada curso incluye: título creativo, descripción extensa, imagen, configuración de tiempo/requisitos/material, 20 lecciones con títulos generados y contenido placeholder, quiz principal con preguntas placeholder (1 por lección, 3 opciones), `aiSystemPrompt` base y `n8nWebhookUrl` específica.
    *   Los campos `aiModelName`, `aiTemperature`, `aiMaxTokensResponse` fueron eliminados de los datos de los cursos en el seed.
    *   Se utiliza `upsert` para mayor idempotencia y se incluyen funciones helper para generar títulos de lecciones.
    *   Corregidos errores de ejecución del seeder relacionados con campos `description` en `SubscriptionPlan` y `transactionId` en `UserSubscription` que no estaban en el schema.
    *   ✅ Migración (`initial_production_setup`) y `db seed` ejecutados exitosamente con los 4 cursos.
*   **Mejoras en la Interfaz de Usuario (UI) General y Vista de Lección:**
    *   **Nombre y Versión:** Actualizado a "Academia AI v1.0" en la barra de navegación (`src/views/partials/header.ejs`).
    *   **Iconos del Menú Lateral (Admin):** Actualizados en `src/views/partials/sidebar.ejs` para mayor claridad (ej. Catálogo: `book-open`, Admin Cursos: `archive`, Admin Planes: `list`).
    *   **Iconos de Lecciones:**
        *   En la lista de lecciones de `src/views/courseDetail.ejs`, el icono general es `file-text`.
        *   En la lista lateral de `src/views/lessonDetail.ejs`, la lección activa usa `check-circle` y las demás `file-text`.
    *   **Navegación entre Lecciones:**
        *   ✅ `src/controllers/courseController.js` (`getLessonById`) ahora carga datos de la lección anterior y siguiente.
        *   ✅ `src/views/lessonDetail.ejs` implementa botones funcionales "Anterior Lección" y "Siguiente Lección".
    *   **Layout de Vista de Lección:**
        *   ✅ El sidebar principal (fijo en desktop) ahora se oculta en `src/views/lessonDetail.ejs` para dar más espacio al contenido. Sigue accesible mediante el botón offcanvas del header. (Implementado mediante variable `hideMainSidebar` pasada por el controlador y lógica condicional en `layouts/main.ejs` y `partials/sidebar.ejs`).
        *   ✅ La lista de lecciones del curso actual se muestra correctamente en el panel lateral de `lessonDetail.ejs` (corregida la carga de datos en `courseController.js`).
*   **Refinamiento Avanzado del Widget de Chat n8n (`@n8n/chat`):**
    *   **Objetivo:** Solucionar errores persistentes de inicialización, asegurar el paso correcto de datos dinámicos (ID de usuario, metadata, textos i18n) y personalizar la experiencia del chat.
    *   **Desarrollo y Soluciones:**
        *   Se mantuvo el CSS del widget en `layouts/main.ejs` y el contenedor `div#n8n-chat-container` en `lessonDetail.ejs`.
        *   **Estrategia de Paso de Datos:** Se adoptó el método de pasar todos los datos dinámicos necesarios para `createChat` (URL del webhook, plantilla de mensaje inicial, títulos de curso/lección, ID de usuario, nombre de usuario, URL de avatar, ID de curso/lección para metadata, y textos para i18n) a través de atributos `data-*` en el `div#n8n-chat-container`.
        *   **Sanitización de Atributos HTML:** Se implementó y depuró una función `attrEscape` en el bloque EJS del servidor. La corrección crucial fue asegurar el orden correcto de los reemplazos de entidades HTML, escapando `&` a `&` *antes* que otros caracteres (`"`, `'`, `<`, `>`). Esto es vital para evitar la corrupción de los valores de los atributos y errores de parseo de EJS.
        *   **Script del Cliente:** El script `<script type="module">` en `lessonDetail.ejs` fue modificado para:
            *   Leer todos los valores de los atributos `data-*` del `chatContainer`.
            *   Convertir explícitamente estos valores a cadenas, con valores por defecto en caso de ser `undefined`.
            *   Construir el mensaje inicial final (`finalInitialMessage`) usando la plantilla y los títulos recuperados.
            *   Construir los objetos `user`, `metadata`, e `i18n` (para el idioma 'es') con los datos recuperados.
            *   Configurar `showWelcomeScreen: false` para usar el `initialMessages` personalizado.
            *   Añadir `console.log` detallados para depurar los valores de los atributos `data-*` y el objeto `chatConfig` completo antes de pasarlo a `createChat`.
            *   Incluir un bloque `try...catch` alrededor de `createChat` para manejar posibles errores de inicialización.
        *   **Errores Abordados:**
            *   Errores de parseo de EJS (`Could not find matching close tag`): Solucionados al simplificar la inserción de datos en el HTML y asegurar la correcta sanitización.
            *   Error `ReferenceError: lesson is not defined` (cliente): Solucionado al no intentar acceder a variables EJS directamente en el script del cliente, sino a través de `data-attributes`.
            *   Error `Input data should be a String` (biblioteca n8n): Se espera que esté solucionado con la correcta sanitización de `attrEscape` y la verificación de que todos los datos pasados a `createChat` sean del tipo esperado (especialmente cadenas). Los `console.log` ayudarán a confirmar esto.
    *   **Estado Actual del Chat (Esperado):**
        *   El chat debería inicializarse sin errores de EJS en el servidor ni errores de JavaScript ("Input data should be a String") en el cliente.
        *   Debería mostrar el mensaje inicial personalizado.
        *   Debería utilizar los textos `i18n` personalizados para la interfaz del chat en español.
        *   Debería enviar correctamente el `userId`, `userName`, `userAvatarUrl` (como parte del objeto `user`) y `courseId`, `lessonId` (como parte del objeto `metadata`) a n8n cuando se interactúa con el chat.

(Se han omitido secciones de "Ajustes y Correcciones Adicionales Implementadas (Previas)" y "Additional UI/UX Enhancements Implemented (Previas)" por brevedad, ya que el foco está en los cambios más recientes y el estado actual).

---

## **Flujo del Alumno (Diagrama)**
graph TD
    A[Visitante] --> B(Página de Registro);
    B -- Ingresa Datos --> C{Auth Controller: registerUser};
    C -- Crea User en BD --> D(Usuario Registrado / Logueado);
    D --> E(Página de Planes de Suscripción);
    E -- Elige Plan --> F(Página de Checkout con Métodos de Pago);
    F -- Elige PayPal --> G(Redirige a PayPal);
    G -- Pago Exitoso --> H(Webhook PayPal);
    H -- Notifica Backend --> I{Subscription Controller: Crea UserSubscription activa};
    F -- Elige QR/Transferencia --> J(Muestra Datos QR/Banco);
    J -- Usuario Paga y Notifica --> K{Subscription Controller: Crea UserSubscription pendiente};
    K --> L(Admin Verifica Pago);
    L -- Pago Confirmado --> I;
    I --> M(Usuario con Suscripción Activa);
    M --> N(Accede al Catálogo de Cursos);
    N -- Selecciona Curso --> O(Ve Detalle del Curso/Lección);
