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
*   **Markdown Processing:** `marked` (servidor y cliente), `easymde` (cliente).
*   **Syntax Highlighting:** `highlight.js`.
*   **Client-Side Text-to-Speech:** Web Speech API (`SpeechSynthesis`).

---

## **Phase 0: Project Scaffolding and Environment Setup**

**Status: COMPLETED**
*   ... (Contenido sin cambios) ...

---

## **Phase 1: Database Modeling and Secure User Authentication**

**Status: COMPLETADA (Revisada y Extendida)**
*   ... (Contenido sin cambios) ...

---

## **Phase 2: Course and Lesson Content Structure (Adaptada a Suscripciones)**

**Status: COMPLETADA (Adaptada)**
*   ... (Contenido sin cambios) ...

---

## **Phase 3: AI Agent Integration (Simulación Inicial)**

**Status: OBSOLETA (Reemplazada por Fase G y H)**
*   ... (Contenido sin cambios) ...

---

## **Phase 4: Administration Panel (Adaptado a Suscripciones y Nuevas Entidades)**

**Status: EN PROGRESO (Mayormente Completado)**
*   ... (Contenido sin cambios) ...

---

## **Phase 5: Definición Detallada de Cursos y Gestión de Tags (Integrada y Adaptada)**

**Status: COMPLETADA (Adaptada y Mejorada)**
*   ... (Contenido sin cambios) ...

---

## **Phase F: Asistente IA Interactivo con n8n (Descartado)**
*   ... (Contenido sin cambios) ...

---

## **Phase G: Real-time Chat Module & Privacy Fixes**

**Status: COMPLETADO Y ROBUSTO**
*   ... (Contenido sin cambios) ...

---

## **Phase H: UI/UX Refinements for Lessons & Chat**

**Status: COMPLETADA Y MEJORADA**
*   ... (Contenido sin cambios) ...

---

## **Phase I: Capacidades Avanzadas del Agente IA (Planificación)**

**Status: PENDIENTE**
*   ... (Contenido sin cambios) ...

---

## **Phase J: Estandarización de UI y Refactorización de Vistas**

**Status: COMPLETADA**

**Objective:** Refactorizar las vistas principales para eliminar código duplicado, estandarizar la apariencia y mejorar la mantenibilidad del frontend.

**Development & Fixes:**

*   **Creación de Partials Reutilizables:**
    *   ✅ **`_content-header.ejs`:** Se creó un nuevo partial para las cabeceras de las tarjetas de contenido. Este componente recibe variables como `title` y `showTTS`, garantizando que todas las cabeceras de página (cursos, lecciones, etc.) tengan un aspecto idéntico y se gestionen desde un único archivo.
    *   ✅ **`_tts-script.ejs`:** Se extrajo toda la lógica del narrador de Texto a Voz (TTS) a su propio partial. Este script ahora acepta un selector de contenido como parámetro (`contentSelector`), lo que permite reutilizarlo en cualquier página que necesite narrar un bloque de texto específico.

*   **Refactorización de Vistas Principales:**
    *   ✅ **`lessonDetail.ejs`:** Se refactorizó para eliminar su código de cabecera y de script de TTS, y en su lugar ahora incluye los nuevos partials `_content-header` y `_tts-script`, pasándoles las variables correspondientes.
    *   ✅ **`courseDetail.ejs`:** Se aplicó la misma refactorización. Se añadió la funcionalidad de narrador a la página de detalles del curso y se estandarizó su cabecera para que sea idéntica a la de las lecciones, usando los mismos partials.

*   **Separación de Layouts:**
    *   ✅ **`admin.ejs`:** Se creó un nuevo layout principal (`src/views/layouts/admin.ejs`) dedicado exclusivamente para el panel de administración.
    *   ✅ **`main.ejs`:** Se simplificó el layout principal para que sirva únicamente a las vistas públicas de la plataforma.
    *   ✅ **Actualización de Controladores:** Todos los controladores del panel de administración fueron actualizados para que rendericen sus vistas usando el nuevo `layout: 'layouts/admin'`, resolviendo conflictos de estilo y estructura.

---

## **Phase K: Gestión de Suscripciones y Control de Acceso**

**Status: COMPLETADA**

**Objective:** Implementar una interfaz para que los administradores puedan ver las suscripciones de los usuarios y crear un sistema de control de acceso al contenido basado en el estado de dichas suscripciones.

**Development & Fixes:**

*   **UI de Gestión de Suscripciones:**
    *   ✅ **Vista de Tabla:** Se creó una nueva vista en `src/views/admin/subscriptions/index.ejs` que muestra una tabla con todas las suscripciones, incluyendo información del usuario, el plan, el estado (Activa/Vencida) y las fechas de inicio/fin.
    *   ✅ **Controlador y Rutas:** Se implementó el `subscriptionAdminController.js` y las rutas correspondientes en `subscriptionAdminRoutes.js` para obtener los datos de la base de datos y renderizar la vista.
    *   ✅ **Integración en Menú:** Se añadió el enlace "Suscripciones" a los menús del panel de administración (móvil y escritorio) en `sidebar.ejs` para un acceso fácil.

*   **Middleware de Control de Acceso:**
    *   ✅ **`checkActiveSubscription.js`:** Se creó un nuevo middleware para verificar si un usuario tiene una suscripción activa.
    *   ✅ **Lógica de Verificación:** El middleware comprueba si la suscripción del usuario está activa y si la fecha de vencimiento no ha pasado. Los administradores tienen acceso libre.
    *   ✅ **Protección de Rutas:** El middleware se aplicó a las rutas críticas de contenido (`/courses/:id` y `/courses/:courseId/lessons/:lessonId`) para restringir el acceso a usuarios sin una suscripción válida.

*   **Corrección de Errores:**
    *   ✅ Se solucionó un error de `Cannot GET /login` al corregir las redirecciones para que apuntaran a la ruta correcta con prefijo: `/auth/login`.
    *   ✅ Se corrigió un error de `PrismaClientInitializationError` que resultó ser un nombre de modelo incorrecto en una consulta (`prisma.subscription` en lugar de `prisma.userSubscription`).
    *   ✅ Se solucionó un error de `Failed to lookup view` al separar los layouts de administración y públicos y actualizar los controladores para que usaran el layout correcto.

---

## **Flujo del Alumno (Diagrama)**
*   ... (Contenido sin cambios) ...
