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
- **Variables de Entorno:** `dotenv`
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
    -   **Importante:** Si es la primera vez, elimina la carpeta `prisma/migrations` si existe.
    -   Crea y aplica la migración inicial:
        ```bash
        npx prisma migrate dev --name init
        ```
4.  **Poblar la Base de Datos con Datos de Producción:**
    ```bash
    npx prisma db seed
    ```
    Este comando creará 9 cursos detallados, usuarios de prueba (admin y student) y planes de suscripción.

5.  **Iniciar el Servidor de Desarrollo:**
    ```bash
    npm run dev
    ```
    El servidor estará disponible en `http://localhost:4000` (o el puerto definido en tu `.env`).

---

## Roadmap de Desarrollo

### Fase P: Refinamiento y Contenido de Producción (Sesión 25/06/2025)
- **Estado:** ✅ **COMPLETADA**
- **Resumen:** Se realizó una sesión intensiva de corrección de bugs, mejoras de UI y generación de contenido para dejar la plataforma en un estado más robusto y listo para producción.
- **Logros y Funcionalidades:**
    -   **Seed de Producción Detallado:** Se reemplazó el `seed.js` básico por uno de calidad de producción, generando 9 cursos completos con descripciones creativas, temarios extensos (20 a 60 lecciones), y un banco de preguntas inicial para cada uno.
    -   **Corrección de Flujo de Autenticación:** Se ajustó la lógica de login para que la verificación de email sea obligatoria **solo para usuarios con rol `STUDENT`**, permitiendo a los administradores iniciar sesión sin este paso.
    -   **Corrección de Flujo de Pago QR:** Se eliminó un bug crítico que permitía a los usuarios crear múltiples suscripciones pendientes para el mismo plan, asegurando que solo exista una intención de compra a la vez.
    -   **Mejora de UI en Admin (DataTables):** Se implementó la librería **DataTables** en la tabla de gestión de suscripciones del panel de administración, añadiendo funcionalidades de búsqueda, paginación y ordenamiento para una mejor experiencia de gestión.
    -   **Mejora de UI en Admin (SweetAlert2):** Se reemplazó la alerta nativa `confirm()` del navegador por una notificación moderna y estilizada con **SweetAlert2** al momento de aprobar una suscripción.
    -   **Rediseño de Perfil de Usuario:** La página de "Editar Perfil" fue completamente rediseñada con una UI más limpia y profesional, utilizando una estructura de dos columnas, previsualización de avatar en tiempo real y añadiendo una sección para el cambio de contraseña.

### Fase N: Implementación de Pasarelas de Pago
- **Estado:** 🟡 **EN PROGRESO**
- **Resumen:** El flujo de pago manual por QR está funcional y robustecido. La integración con PayPal queda como la principal tarea pendiente.
- **Tareas Pendientes:**
    1.  **Integración con PayPal:**
        -   Implementar la lógica para comunicarse con la API de PayPal (crear orden, capturar pago).
        -   Utilizar el SDK de PayPal en el frontend.
        -   Activar la suscripción automáticamente tras la confirmación del pago.

### Problemas Conocidos y Tareas Pendientes
-   **Error de Email "Relay Not Permitted":** El servidor de correo configurado actualmente solo permite enviar correos desde su propio dominio (ej: `percyalvarez.com`). Falla al intentar enviar notificaciones a usuarios con otros dominios (ej: `student@academiaai.com`).
    -   **Solución Temporal:** El `seed.js` fue actualizado para usar un correo del dominio autorizado (`student@percyalvarez.com`) para permitir las pruebas.
    -   **Solución Definitiva:** Se debe configurar el proveedor de correo para autorizar el envío desde otros dominios (mediante registros SPF/DKIM).
-   **Bug de Renderizado en Perfil de Usuario:** Persiste un problema visual donde el menú lateral (sidebar) no se muestra en la página `/profile/edit`, a pesar de que el código del controlador, la vista y el layout parecen ser correctos.
    -   **Próximo Paso:** Requiere una depuración manual en el entorno de desarrollo, posiblemente inspeccionando el DOM y los estilos aplicados en tiempo de ejecución para identificar la causa raíz.
