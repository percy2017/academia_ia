# Academia AI - Plataforma de E-Learning

Academia AI es una plataforma de e-learning personalizada construida con Node.js, Express, PostgreSQL y Prisma. Incorpora un sistema de gestión de contenidos, autenticación de usuarios, panel de administración, y un módulo de suscripciones para el acceso a los cursos.

---

## Core Technologies

- **Backend:** Node.js (`"type": "module"`)
- **Framework:** Express.js
- **Base de Datos:** PostgreSQL
- **ORM:** Prisma
- **Motor de Plantillas:** EJS con `express-ejs-layouts`
- **Frontend:** Bootstrap 5, DataTables, SweetAlert2
- **Comunicación Real-time:** Socket.IO
- **Seguridad:** `bcrypt` (hashing), `express-session` con `connect-pg-simple` (sesiones)
- **Gestión de Archivos:** `multer`
- **Notificaciones por Correo:** `nodemailer`
- **Variables de Entorno:** `dotenv`, `cross-env`
- **Procesamiento de Markdown:** `marked`, `sanitize-html`
- **Dependencias Adicionales:** `connect-flash`, `method-override`, `@google/generative-ai`, LangChain.

---

## Estructura del Proyecto

```
/
├── prisma/             # Esquemas, migraciones y seed de la base de datos
├── public/             # Archivos estáticos (CSS, JS, imágenes)
├── src/
│   ├── controllers/    # Lógica de negocio para cada ruta
│   ├── lib/            # Módulos de ayuda (Prisma, IA, Sockets, Email)
│   ├── middleware/     # Middlewares de Express (auth, uploads, etc.)
│   ├── routes/         # Definición de rutas de la API
│   └── views/          # Plantillas EJS
├── .env.example        # Ejemplo de variables de entorno
├── package.json
└── server.js           # Punto de entrada de la aplicación
```

---

## Instalación y Ejecución

1.  **Clonar el repositorio.**
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Configurar la Base de Datos:**
    -   Asegúrate de tener PostgreSQL en ejecución.
    -   Crea un archivo `.env` a partir de `.env.example` y configura las variables `DATABASE_URL` y `EMAIL_HOST`, `EMAIL_USER`, etc.
    -   **Importante:** Si es la primera vez o quieres una base de datos limpia, ejecuta:
        ```bash
        npx prisma migrate reset
        ```
        Este comando borrará la base de datos, aplicará todas las migraciones y ejecutará el `seed`.
4.  **Poblar la Base de Datos (si no se usó `migrate reset`):**
    ```bash
    npx prisma db seed
    ```
5.  **Iniciar el Servidor de Desarrollo:**
    ```bash
    npm run dev
    ```
    El servidor estará disponible en `http://localhost:4000` (o el puerto definido en tu `.env`).

---

## Roadmap de Desarrollo

### Fase R: Refactorización y Mejoras de Admin (Sesión 26/06/2025)
- **Estado:** ✅ **COMPLETADA**
- **Resumen:** Sesión enfocada en la refactorización de la arquitectura del Agente de IA, la solución de bugs de UI y la adición de funcionalidades clave en el panel de administración para mejorar la gestión de usuarios.
- **Logros y Funcionalidades:**
    -   **Refactorización del Agente de IA:** Se tomó la decisión arquitectónica de **eliminar al Agente de IA como un registro en la tabla `User`**. Esto implicó:
        -   Modificar el `schema.prisma` para que los `ChatMessage` ya no requieran un `senderId` (haciéndolo opcional) y añadiendo un campo `source` para identificar si el mensaje proviene de un "USER" o de la "AI".
        -   Aplicar una nueva migración a la base de datos (`agent-refactor`).
        -   Actualizar el `seed.js` para eliminar la creación del usuario `ai-agent`.
        -   Refactorizar el `socketHandler.js` para manejar la nueva lógica de guardado de mensajes y la consulta del historial de chat.
        -   Ajustar el frontend en `lessonDetail.ejs` para renderizar los mensajes basándose en la nueva `source`.
    -   **Solución de Bug de Renderizado en Perfil:** Se corrigió un bug crítico que impedía que el menú lateral (sidebar) se renderizara en la página de "Editar Perfil". El problema se debía a que la consulta del controlador no incluía el `role` del usuario, impidiendo que la vista condicional del sidebar mostrara las opciones.
    -   **Mejoras de Gestión de Usuarios (Admin):**
        -   **Reenvío de Correo de Verificación:** Se implementó la funcionalidad para que el administrador pueda reenviar el correo de verificación a los usuarios no verificados directamente desde la tabla de gestión de usuarios.
        -   **Eliminación de Usuarios:** Se añadió un botón y la lógica de backend correspondiente para permitir al administrador eliminar usuarios, con una confirmación de seguridad y una regla que impide la auto-eliminación.
    -   **Solución de Envío de Correos en Desarrollo:** Para resolver el problema de "Relay Not Permitted" y facilitar las pruebas, se implementó **Ethereal.email**. Ahora, en modo desarrollo (`npm run dev`), los correos se capturan y se muestra un enlace de previsualización en la consola en lugar de intentar un envío real. El envío real solo se activa en producción (`npm start`).
    -   **Mejoras de UI/UX:**
        -   Se simplificó el menú desplegable del usuario en la barra de navegación superior para eliminar enlaces redundantes con el sidebar.
        -   Se ajustó el estilo del campo de teléfono en la página de edición de perfil para que ocupe el 100% del ancho, mejorando la consistencia visual del formulario.

### Fase P: Refinamiento y Contenido de Producción (Sesión 25/06/2025)
- **Estado:** ✅ **COMPLETADA**
- **Resumen:** Se realizó una sesión intensiva de corrección de bugs, mejoras de UI y generación de contenido para dejar la plataforma en un estado más robusto y listo para producción.
- **Logros y Funcionalidades:**
    -   **Seed de Producción Detallado:** Se reemplazó el `seed.js` básico por uno de calidad de producción.
    -   **Corrección de Flujo de Autenticación:** Se ajustó la lógica de login para el rol `STUDENT`.
    -   **Corrección de Flujo de Pago QR:** Se eliminó un bug de suscripciones pendientes múltiples.
    -   **Mejora de UI en Admin (DataTables & SweetAlert2):** Se implementaron librerías para mejorar la experiencia en la gestión de suscripciones.
    -   **Rediseño de Perfil de Usuario:** Se rediseñó la página "Editar Perfil".

### Fase N: Implementación de Pasarelas de Pago
- **Estado:** 🟡 **EN PROGRESO**
- **Resumen:** El flujo de pago manual por QR está funcional y robustecido. La integración con PayPal queda como la principal tarea pendiente.
- **Tareas Pendientes:**
    1.  **Integración con PayPal:**
        -   Implementar la lógica para comunicarse con la API de PayPal.
        -   Activar la suscripción automáticamente tras la confirmación del pago.

### Problemas Conocidos y Tareas Pendientes
-   **Error de Email "Relay Not Permitted" en Producción:** El problema de envío de correos a dominios externos persiste, pero **ha sido mitigado en el entorno de desarrollo** mediante el uso de Ethereal.email.
    -   **Solución para Desarrollo:** ✅ **Implementada.** Los correos se previsualizan en la consola.
    -   **Solución Definitiva para Producción:** Aún se requiere configurar el proveedor de correo para autorizar el envío desde otros dominios (mediante registros SPF/DKIM) para que los correos reales lleguen a servicios como Gmail, etc.
-   **Bug de Renderizado en Perfil de Usuario:** ✅ **SOLUCIONADO.**
