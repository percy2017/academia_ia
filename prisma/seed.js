import { PrismaClient, CourseLevel, CourseStatus, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const generateSlug = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '').replace(/-+$/, '');
};

async function upsertCourseWithContent(courseData) {
  const { title, payload, lessons, questions, tags } = courseData;
  const searchSlug = generateSlug(title);

  const course = await prisma.course.upsert({
    where: { slug: searchSlug },
    update: { ...payload, tags: { connect: tags } },
    create: {
      ...payload,
      title: title,
      slug: searchSlug,
      tags: { connect: tags },
      lessons: { create: lessons },
      quizzes: {
        create: [{
          title: `Cuestionario Principal - ${title}`,
          description: `Evaluación completa para el curso ${title}.`,
          quizType: 'KNOWLEDGE_CHECK',
          questions: { create: questions }
        }]
      }
    },
    include: { lessons: true, quizzes: { include: { questions: true } } },
  });

  console.log(`Curso procesado: "${course.title}" con ${course.lessons.length} lecciones y ${course.quizzes[0]?.questions.length || 0} preguntas.`);
}

async function main() {
  console.log('Iniciando el sembrado de datos para producción...');

  // 1. Upsert Users
  const adminPassword = await bcrypt.hash('adminprod123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@academiaai.com' },
    update: { name: 'Administrador Principal', password: adminPassword, role: Role.ADMIN, emailVerified: new Date() },
    create: { email: 'admin@academiaai.com', name: 'Administrador Principal', password: adminPassword, role: Role.ADMIN, emailVerified: new Date() },
  });
  console.log(`Usuario administrador procesado: admin@academiaai.com`);

  const studentPassword = await bcrypt.hash('studentprod123', 10);
  await prisma.user.upsert({
    where: { email: 'student@percyalvarez.com' },
    update: { name: 'Estudiante de Prueba', password: studentPassword, role: Role.STUDENT, emailVerified: new Date() },
    create: { email: 'student@percyalvarez.com', name: 'Estudiante de Prueba', password: studentPassword, role: Role.STUDENT, emailVerified: new Date() },
  });
  console.log(`Usuario estudiante procesado: student@percyalvarez.com`);

  await prisma.user.upsert({
    where: { id: 'ai-agent' },
    update: {},
    create: { id: 'ai-agent', email: 'ai-agent@academiaai.com', name: 'MentorIA', password: '', role: Role.STUDENT },
  });
  console.log('Usuario Agente IA procesado.');

  // 2. Upsert Tags
  const tagsData = [
      { name: 'Desarrollo Web', slug: 'desarrollo-web' }, { name: 'DevOps', slug: 'devops' },
      { name: 'Docker', slug: 'docker' }, { name: 'PHP', slug: 'php' }, { name: 'Python', slug: 'python' },
      { name: 'JavaScript', slug: 'javascript' }, { name: 'Ciencia de Datos', slug: 'ciencia-de-datos' },
      { name: 'Backend', slug: 'backend' }, { name: 'Frontend', slug: 'frontend' }, { name: 'Laravel', slug: 'laravel' },
      { name: 'Django', slug: 'django' }, { name: 'Express.js', slug: 'express-js' }, { name: 'Bases de Datos', slug: 'bases-de-datos' },
      { name: 'MySQL', slug: 'mysql' }, { name: 'PostgreSQL', slug: 'postgresql' }, { name: 'Control de Versiones', slug: 'control-de-versiones' },
      { name: 'GitHub', slug: 'github' }
  ];
  for (const tag of tagsData) {
      await prisma.tag.upsert({ where: { slug: tag.slug }, update: { name: tag.name }, create: tag });
  }
  console.log('Etiquetas procesadas.');

  // --- Generic AI Prompt Template ---
  const commonAIPrompt = "Eres MentorIA, un tutor experto y amigable para el curso '{{courseTitle}}'. El estudiante es {{userName}} ({{userEmail}}), quien ha completado el {{courseProgress}}% del curso y su último puntaje en los cuestionarios es de {{lastQuizScore}}%. Tu tarea es ayudarlo con sus dudas sobre la lección actual: '{{lessonTitle}}'. Proporciona explicaciones claras y concisas, ejemplos de código prácticos si es relevante, y anímalo a seguir adelante. Si la pregunta del estudiante es muy general o se desvía del tema, guíalo amablemente de regreso al contenido de la lección actual. Tu tono debe ser siempre paciente, alentador y didáctico.";

  // --- Courses Data ---

  const courses = [
    // 1. Docker
    {
      title: "Docker: De Cero a Héroe de los Contenedores",
      payload: {
        shortDescription: "Domina Docker y orquesta contenedores como un profesional del DevOps.",
        description: "<h3>🚀 Docker: De Cero a Héroe de los Contenedores 🚀</h3><p>Sumérgete en el universo de la contenerización con Docker. Este curso no es solo un tutorial; es una inmersión profunda que te transformará en un arquitecto de aplicaciones modernas, portátiles y escalables. Aprenderás a empaquetar cualquier aplicación, sin importar su complejidad, en contenedores ligeros y eficientes. Olvídate del 'funciona en mi máquina'; con Docker, funcionará en todas partes. Desde los conceptos fundamentales como imágenes y volúmenes, hasta la orquestación de múltiples servicios con Docker Compose y la exploración de clústeres con Swarm, este curso te dará el conocimiento y la confianza para revolucionar tu flujo de desarrollo y despliegue. Al finalizar, no solo sabrás usar Docker, sino que pensarás en contenedores.</p>",
        imageUrl: null,
        level: CourseLevel.INTERMEDIATE, status: CourseStatus.PUBLISHED, durationMonths: 1, studyDaysPerWeek: 5, studyHoursPerDay: 2,
        requirements: "Computadora con acceso a internet y conocimientos básicos de la línea de comandos.",
        additionalMaterialInfo: "Tendrás acceso a un VPS en producción para tus experimentos:\n- Portainer: https://portainer.percyalvarez.com\n- Webmin: https://154.53.42.52:10000\n- User: student\n- Pass: Academia2025$",
        aiSystemPrompt: commonAIPrompt,
      },
      tags: [{ slug: 'docker' }, { slug: 'devops' }, { slug: 'backend' }],
      lessons: Array.from({ length: 20 }, (_, i) => ({
        title: `Día ${i + 1}: ${[
          "Fundamentos de la Contenerización", "Instalación y Tu Primer Contenedor", "Imágenes Docker: El ADN de tus Apps", "Comandos Esenciales de Gestión",
          "Creando Imágenes a Medida con Dockerfiles", "Persistencia de Datos con Volúmenes", "Networking: Conectando Contenedores", "Orquestación Sencilla con Docker Compose",
          "Multi-stage Builds: Optimizando Imágenes", "Docker Hub y Registros Privados", "Seguridad en el Ecosistema Docker", "Introducción a Docker Swarm",
          "Gestión de Secretos y Configuraciones", "Monitoreo y Logging de Contenedores", "Integración Continua con Docker y GitHub Actions", "Desplegando en un VPS Real",
          "Resolución de Problemas Comunes (Troubleshooting)", "Patrones de Diseño con Contenedores", "Docker en el Desarrollo Local", "Proyecto Final: Contenerizando una Aplicación Completa"
        ][i]}`,
        content: `<p>Contenido detallado para la lección del día ${i + 1}.</p>`,
        order: i + 1,
      })),
      questions: Array.from({ length: 20 }, (_, i) => ({
        text: `Pregunta del Día ${i + 1}: ¿Cuál es el propósito principal de un Dockerfile?`,
        options: [
          { text: "Definir las instrucciones para construir una imagen de Docker.", isCorrect: true },
          { text: "Ejecutar un contenedor.", isCorrect: false },
          { text: "Gestionar las redes entre contenedores.", isCorrect: false },
        ],
        order: i + 1,
        points: 10,
      })),
    },
    // 2. PHP
    {
      title: "PHP Moderno: El Renacimiento del Gigante Web",
      payload: {
        shortDescription: "Redescubre PHP y construye APIs y aplicaciones robustas con las últimas prácticas del lenguaje.",
        description: "<h3>💎 PHP Moderno: El Renacimiento del Gigante Web 💎</h3><p>PHP ha evolucionado. Lejos de ser solo un lenguaje de scripting, el PHP moderno es rápido, robusto y cuenta con un ecosistema maduro que impulsa una gran parte de la web. En este curso, te embarcarás en un viaje para dominar PHP en su versión más reciente. Dejaremos atrás las viejas prácticas y nos sumergiremos en la Programación Orientada a Objetos, el manejo de dependencias con Composer, la creación de APIs RESTful, y la interacción segura con bases de datos usando PDO. Aprenderás a escribir código limpio, mantenible y seguro, aplicando patrones de diseño que te permitirán construir aplicaciones escalables y profesionales. Este no es el PHP que recuerdas; es el PHP que necesitas conocer hoy.</p>",
        imageUrl: null,
        level: CourseLevel.INTERMEDIATE, status: CourseStatus.PUBLISHED, durationMonths: 1, studyDaysPerWeek: 5, studyHoursPerDay: 2,
        requirements: "Computadora, internet, VS Code y un entorno de desarrollo como XAMPP.",
        additionalMaterialInfo: "Tendrás acceso a un VPS en producción para tus experimentos:\n- Webmin: https://154.53.42.52:10000\n- User: student\n- Pass: Academia2025$",
        aiSystemPrompt: commonAIPrompt,
      },
      tags: [{ slug: 'php' }, { slug: 'desarrollo-web' }, { slug: 'backend' }],
      lessons: Array.from({ length: 20 }, (_, i) => ({
        title: `Día ${i + 1}: ${[
          "El Ecosistema de PHP 8+", "Sintaxis Fundamental y Tipado Estricto", "Estructuras de Control y Funciones Avanzadas", "Arrays, Iteradores y Colecciones",
          "Principios de la Programación Orientada a Objetos", "Herencia, Polimorfismo e Interfaces", "Traits y Clases Anónimas", "Composer: El Gestor de Dependencias",
          "Autoloading con PSR-4", "Manejo de Peticiones HTTP (GET/POST)", "Validación y Sanitización de Datos", "Gestión de Sesiones y Cookies",
          "Interactuando con el Sistema de Archivos", "PDO: Conexión Segura a Bases de Datos", "CRUD con PHP y MySQL", "Prevención de Inyecciones SQL y XSS",
          "Creando una API RESTful Básica", "Manejo de Errores y Excepciones", "Introducción a los Patrones de Diseño (Singleton, Factory)", "Proyecto Final: API para un Blog"
        ][i]}`,
        content: `<p>Contenido detallado para la lección del día ${i + 1}.</p>`,
        order: i + 1,
      })),
      questions: Array.from({ length: 20 }, (_, i) => ({
        text: `Pregunta del Día ${i + 1}: ¿Qué herramienta se utiliza en PHP moderno para gestionar dependencias?`,
        options: [
          { text: "Composer", isCorrect: true },
          { text: "NPM", isCorrect: false },
          { text: "PEAR", isCorrect: false },
          { text: "Pip", isCorrect: false },
        ],
        order: i + 1,
        points: 10,
      })),
    },
    // 3. Python
    {
      title: "Python Total: De Scripts a Sistemas Complejos",
      payload: {
        shortDescription: "Conviértete en un desarrollador Python versátil, desde la ciencia de datos hasta el backend.",
        description: "<h3>🐍 Python Total: De Scripts a Sistemas Complejos 🐍</h3><p>Python es más que un lenguaje; es una navaja suiza para resolver problemas del mundo real. Este curso te guiará en un viaje completo a través de su ecosistema. Empezarás escribiendo scripts simples para automatizar tareas y, progresivamente, te sumergirás en la programación orientada a objetos para construir aplicaciones estructuradas. Exploraremos su poder en el análisis de datos con Pandas, crearemos visualizaciones impactantes con Matplotlib y construiremos APIs web con Flask. Además, te conectarás con herramientas de automatización como n8n, llevando tus habilidades a un nivel de producción. Al final, no solo sabrás Python, sino que entenderás cómo aplicarlo para construir soluciones robustas y eficientes en diversos campos tecnológicos.</p>",
        imageUrl: null,
        level: CourseLevel.BEGINNER, status: CourseStatus.PUBLISHED, durationMonths: 1, studyDaysPerWeek: 5, studyHoursPerDay: 2,
        requirements: "Computadora, internet, VS Code y Python (versión 3.7 o superior) instalado.",
        additionalMaterialInfo: "Tendrás acceso a un VPS en producción y a n8n para tus experimentos:\n- Webmin: https://154.53.42.52:10000\n- n8n: https://n8n.percyalvarez.com/webhook/python\n- User: student\n- Pass: Academia2025$",
        aiSystemPrompt: commonAIPrompt,
      },
      tags: [{ slug: 'python' }, { slug: 'desarrollo-web' }, { slug: 'ciencia-de-datos' }, { slug: 'backend' }],
      lessons: Array.from({ length: 20 }, (_, i) => ({
        title: `Día ${i + 1}: ${[
          "Bienvenida al Universo Python", "Variables, Tipos de Datos y Operadores", "Colecciones: Listas, Tuplas y Diccionarios", "Flujos de Control: Condicionales y Bucles",
          "Funciones: Creando Bloques Reutilizables", "Programación Orientada a Objetos (POO)", "Herencia y Polimorfismo en Python", "Manejo de Archivos y Serialización (JSON)",
          "Manejo de Errores y Excepciones", "Entornos Virtuales con venv y pip", "Introducción a la Web con Flask", "Análisis de Datos con Pandas",
          "Visualización de Datos con Matplotlib", "Consumo de APIs REST", "Automatización de Tareas con Scripts", "Testing con unittest",
          "Introducción a SQLAlchemy para Bases de Datos", "Decoradores y Generadores", "Concurrencia básica con Threading", "Proyecto Final: Dashboard de Datos con Flask"
        ][i]}`,
        content: `<p>Contenido detallado para la lección del día ${i + 1}.</p>`,
        order: i + 1,
      })),
      questions: Array.from({ length: 20 }, (_, i) => ({
        text: `Pregunta del Día ${i + 1}: ¿Qué librería es el estándar de facto en Python para el análisis de datos?`,
        options: [
          { text: "Pandas", isCorrect: true },
          { text: "NumPy", isCorrect: false },
          { text: "Flask", isCorrect: false },
        ],
        order: i + 1,
        points: 10,
      })),
    },
    // 4. JavaScript
    {
      title: "JavaScript Moderno: El Lenguaje de la Web Interactiva",
      payload: {
        shortDescription: "Domina JavaScript, desde la manipulación del DOM hasta las complejidades de async/await y los módulos.",
        description: "<h3>✨ JavaScript Moderno: El Lenguaje de la Web Interactiva ✨</h3><p>JavaScript es el motor de la web moderna, y este curso es tu mapa para dominarlo por completo. No nos quedaremos en la superficie; profundizaremos en el porqué de las cosas. Entenderás el DOM a un nivel que te permitirá crear interfaces fluidas y dinámicas. Desmitificaremos la asincronía, dominando Promises y async/await para manejar operaciones complejas sin bloquear la experiencia del usuario. Aprenderás a organizar tu código con módulos ES6, a interactuar con APIs usando Fetch, y a aplicar patrones de diseño que harán tu código más robusto y escalable. Este curso te dará las bases sólidas que necesitas para brillar en cualquier framework o librería moderna.</p>",
        imageUrl: null,
        level: CourseLevel.INTERMEDIate, status: CourseStatus.PUBLISHED, durationMonths: 1, studyDaysPerWeek: 5, studyHoursPerDay: 2,
        requirements: "Computadora, internet, VS Code y conocimientos básicos de HTML y CSS.",
        additionalMaterialInfo: "Tendrás acceso a un VPS en producción para tus experimentos:\n- Webmin: https://154.53.42.52:10000\n- User: student\n- Pass: Academia2025$",
        aiSystemPrompt: commonAIPrompt,
      },
      tags: [{ slug: 'javascript' }, { slug: 'desarrollo-web' }, { slug: 'frontend' }, { slug: 'backend' }],
      lessons: Array.from({ length: 20 }, (_, i) => ({
        title: `Día ${i + 1}: ${[
          "JavaScript: El Corazón de la Web", "Variables (var, let, const) y Tipos de Datos", "Operadores y Coerción de Tipos", "Estructuras de Control y Bucles",
          "Funciones, Scope y Closures", "Manipulación del DOM: Selección y Modificación", "Eventos del DOM: Captura y Propagación", "Arrays y sus Métodos Avanzados",
          "Objetos: Propiedades, Métodos y Prototipos", "ES6+: Arrow Functions, Destructuring y Spread Operator", "Asincronía: Callbacks y el Event Loop", "Promesas: Gestionando el Futuro",
          "Async/Await: Sintaxis Asíncrona Limpia", "Fetch API para Peticiones HTTP", "Manejo de Errores con try...catch", "Módulos de JavaScript (ESM)",
          "Almacenamiento Web: localStorage y sessionStorage", "Introducción a las Herramientas de Desarrollo del Navegador", "Patrones de Diseño en JS (Module, Observer)", "Proyecto Final: Una Aplicación de Tareas Interactiva"
        ][i]}`,
        content: `<p>Contenido detallado para la lección del día ${i + 1}.</p>`,
        order: i + 1,
      })),
      questions: Array.from({ length: 20 }, (_, i) => ({
        text: `Pregunta del Día ${i + 1}: ¿Qué método de array se usa para crear un nuevo array con todos los elementos que pasan una prueba?`,
        options: [
          { text: ".filter()", isCorrect: true },
          { text: ".map()", isCorrect: false },
          { text: ".forEach()", isCorrect: false },
          { text: ".reduce()", isCorrect: false },
        ],
        order: i + 1,
        points: 10,
      })),
    },
    // 5. Laravel
    {
      title: "Laravel: El Framework para Artesanos de la Web",
      payload: {
        shortDescription: "Construye aplicaciones PHP elegantes y escalables con el framework más querido por la comunidad.",
        description: "<h3>🎨 Laravel: El Framework para Artesanos de la Web 🎨</h3><p>Laravel es más que un framework; es una filosofía de desarrollo que prioriza la elegancia, la simplicidad y la productividad. En este curso exhaustivo de 3 meses, te convertirás en un verdadero artesano de Laravel. Iremos más allá de la documentación para explorar el núcleo del framework: el contenedor de servicios, los facades, y el ciclo de vida de la petición. Dominarás Eloquent ORM para interactuar con tu base de datos de una forma expresiva y potente. Construirás interfaces dinámicas con Blade y Livewire, y crearás APIs robustas para servir a cualquier cliente. Cubriremos temas avanzados como el programador de tareas, las colas de trabajo, el testing y la autenticación con Laravel Sanctum. Al finalizar, estarás preparado para construir aplicaciones profesionales, complejas y de alto rendimiento.</p>",
        imageUrl: null,
        level: CourseLevel.ADVANCED, status: CourseStatus.PUBLISHED, durationMonths: 3, studyDaysPerWeek: 5, studyHoursPerDay: 2,
        requirements: "Computadora, internet, XAMPP, VS Code y conocimientos sólidos de PHP (se recomienda el curso de PHP Moderno).",
        additionalMaterialInfo: "Tendrás acceso a un VPS en producción para tus experimentos:\n- Webmin: https://154.53.42.52:10000\n- User: student\n- Pass: Academia2025$",
        aiSystemPrompt: commonAIPrompt,
      },
      tags: [{ slug: 'laravel' }, { slug: 'php' }, { slug: 'backend' }, { slug: 'desarrollo-web' }],
      lessons: Array.from({ length: 60 }, (_, i) => ({
        title: `Día ${i + 1}: Lección de Laravel`,
        content: `<p>Contenido detallado para la lección del día ${i + 1} de Laravel.</p>`,
        order: i + 1,
      })),
      questions: Array.from({ length: 60 }, (_, i) => ({
        text: `Pregunta del Día ${i + 1}: ¿Qué componente de Laravel es responsable de convertir las URLs amigables en llamadas a controladores?`,
        options: [
          { text: "El Enrutador (Router)", isCorrect: true },
          { text: "El Motor de Plantillas Blade", isCorrect: false },
          { text: "El ORM Eloquent", isCorrect: false },
          { text: "El Contenedor de Servicios", isCorrect: false },
        ],
        order: i + 1,
        points: 10,
      })),
    },
    // 6. Django
    {
      title: "Django: Desarrollo Web de Alto Rendimiento",
      payload: {
        shortDescription: "Construye aplicaciones web seguras y escalables con el framework 'para perfeccionistas con fechas de entrega'.",
        description: "<h3>🚀 Django: Desarrollo Web de Alto Rendimiento 🚀</h3><p>Django es un framework web de alto nivel que fomenta el desarrollo rápido y el diseño limpio y pragmático. En este curso intensivo, te sumergirás en la filosofía 'Baterías Incluidas' de Django. Aprenderás a aprovechar su potente ORM para modelar datos complejos, su sistema de administración autogenerado para gestionar tu contenido sin esfuerzo, y su robusto sistema de seguridad para proteger tus aplicaciones. Pasaremos de los fundamentos, como el enrutamiento y las vistas, a temas avanzados como las vistas basadas en clases, el framework de testing, y el despliegue en producción. Al final del curso, serás capaz de construir aplicaciones web completas, desde blogs y tiendas de comercio electrónico hasta redes sociales, de una manera estructurada, segura y eficiente.</p>",
        imageUrl: null,
        level: CourseLevel.ADVANCED, status: CourseStatus.PUBLISHED, durationMonths: 3, studyDaysPerWeek: 5, studyHoursPerDay: 2,
        requirements: "Computadora, internet, VS Code y conocimientos sólidos de Python (se recomienda el curso de Python Total).",
        additionalMaterialInfo: "Tendrás acceso a un VPS en producción para tus experimentos:\n- Webmin: https://154.53.42.52:10000\n- User: student\n- Pass: Academia2025$",
        aiSystemPrompt: commonAIPrompt,
      },
      tags: [{ slug: 'django' }, { slug: 'python' }, { slug: 'backend' }, { slug: 'desarrollo-web' }],
      lessons: Array.from({ length: 60 }, (_, i) => ({
        title: `Día ${i + 1}: Lección de Django`,
        content: `<p>Contenido detallado para la lección del día ${i + 1} de Django.</p>`,
        order: i + 1,
      })),
      questions: Array.from({ length: 60 }, (_, i) => ({
        text: `Pregunta del Día ${i + 1}: En Django, ¿cómo se llama el componente que maneja la lógica de negocio y la interacción con la base de datos?`,
        options: [
          { text: "Modelos (Models)", isCorrect: true },
          { text: "Vistas (Views)", isCorrect: false },
          { text: "Plantillas (Templates)", isCorrect: false },
          { text: "Formularios (Forms)", isCorrect: false },
        ],
        order: i + 1,
        points: 10,
      })),
    },
    // 7. Express.js
    {
      title: "Express.js: APIs Minimalistas, Rendimiento Máximo",
      payload: {
        shortDescription: "Construye APIs rápidas y flexibles con el framework backend por excelencia de Node.js.",
        description: "<h3>⚡ Express.js: APIs Minimalistas, Rendimiento Máximo ⚡</h3><p>En el mundo de Node.js, Express es el rey indiscutible de los frameworks backend. Su filosofía minimalista y sin opiniones te da la libertad de construir APIs exactamente como las necesitas. En este curso, te sumergirás en el arte de construir servidores web eficientes. Aprenderás a gestionar el enrutamiento de forma avanzada, a crear y encadenar middlewares para procesar peticiones, y a servir contenido estático y dinámico. Nos enfocaremos en construir APIs RESTful robustas, seguras y bien estructuradas, listas para ser consumidas por cualquier aplicación frontend. Cubriremos la validación de datos, el manejo de errores, y la integración con bases de datos como MongoDB y PostgreSQL. Al finalizar, tendrás un dominio completo de Express para levantar cualquier tipo de servicio backend que puedas imaginar.</p>",
        imageUrl: null,
        level: CourseLevel.ADVANCED, status: CourseStatus.PUBLISHED, durationMonths: 3, studyDaysPerWeek: 5, studyHoursPerDay: 2,
        requirements: "Computadora, internet, VS Code y conocimientos sólidos de JavaScript y Node.js (se recomienda el curso de JavaScript Moderno).",
        additionalMaterialInfo: "Tendrás acceso a un VPS en producción para tus experimentos:\n- Webmin: https://154.53.42.52:10000\n- User: student\n- Pass: Academia2025$",
        aiSystemPrompt: commonAIPrompt,
      },
      tags: [{ slug: 'express-js' }, { slug: 'javascript' }, { slug: 'backend' }, { slug: 'desarrollo-web' }],
      lessons: Array.from({ length: 60 }, (_, i) => ({
        title: `Día ${i + 1}: Lección de Express.js`,
        content: `<p>Contenido detallado para la lección del día ${i + 1} de Express.js.</p>`,
        order: i + 1,
      })),
      questions: Array.from({ length: 60 }, (_, i) => ({
        text: `Pregunta del Día ${i + 1}: En Express, ¿qué función se utiliza para registrar un middleware que se ejecuta en cada petición?`,
        options: [
          { text: "app.use()", isCorrect: true },
          { text: "app.get()", isCorrect: false },
          { text: "app.listen()", isCorrect: false },
          { text: "app.route()", isCorrect: false },
        ],
        order: i + 1,
        points: 10,
      })),
    },
    // 8. MySQL
    {
      title: "MySQL: El Fundamento de los Datos",
      payload: {
        shortDescription: "Domina la base de datos relacional más popular del mundo, desde queries simples hasta un diseño avanzado.",
        description: "<h3>📊 MySQL: El Fundamento de los Datos 📊</h3><p>Toda gran aplicación se sostiene sobre una base de datos sólida, y MySQL es el pilar de millones de ellas. Este curso te enseñará a hablar el lenguaje de los datos: SQL. Empezarás con las sentencias más básicas para consultar y manipular información. Rápidamente, avanzarás hacia consultas complejas, uniendo tablas, agrupando resultados y utilizando subconsultas para extraer inteligencia de tus datos. Aprenderás a diseñar esquemas de bases de datos normalizados y eficientes, a crear índices para optimizar el rendimiento y a asegurar la integridad de tus datos con transacciones. Al finalizar, tendrás una comprensión profunda de cómo funcionan las bases de datos relacionales y la habilidad para gestionar y consultar datos con total confianza.</p>",
        imageUrl: null,
        level: CourseLevel.BEGINNER, status: CourseStatus.PUBLISHED, durationMonths: 1, studyDaysPerWeek: 5, studyHoursPerDay: 2,
        requirements: "Computadora con acceso a internet.",
        additionalMaterialInfo: "Tendrás acceso a un VPS en producción para tus experimentos:\n- phpMyAdmin: https://phpmyadmin.percyalvarez.com\n- Webmin: https://154.53.42.52:10000\n- User: student\n- Pass: Academia2025$",
        aiSystemPrompt: commonAIPrompt,
      },
      tags: [{ slug: 'mysql' }, { slug: 'bases-de-datos' }, { slug: 'backend' }],
      lessons: Array.from({ length: 20 }, (_, i) => ({
        title: `Día ${i + 1}: Lección de MySQL`,
        content: `<p>Contenido detallado para la lección del día ${i + 1} de MySQL.</p>`,
        order: i + 1,
      })),
      questions: Array.from({ length: 20 }, (_, i) => ({
        text: `Pregunta del Día ${i + 1}: ¿Qué sentencia SQL se utiliza para recuperar datos de una base de datos?`,
        options: [
          { text: "SELECT", isCorrect: true },
          { text: "INSERT", isCorrect: false },
          { text: "UPDATE", isCorrect: false },
          { text: "DELETE", isCorrect: false },
        ],
        order: i + 1,
        points: 10,
      })),
    },
    // 9. PostgreSQL
    {
      title: "PostgreSQL: La Base de Datos para Proyectos Robustos",
      payload: {
        shortDescription: "Descubre por qué PostgreSQL es la elección de los desarrolladores para aplicaciones escalables y fiables.",
        description: "<h3>🐘 PostgreSQL: La Base de Datos para Proyectos Robustos 🐘</h3><p>PostgreSQL no es solo otra base de datos; es un sistema de gestión de bases de datos objeto-relacional potente y de código abierto con más de 30 años de desarrollo activo que le han ganado una sólida reputación por su fiabilidad, robustez de características y rendimiento. En este curso, irás más allá de las consultas básicas para explorar las características que hacen único a PostgreSQL: tipos de datos avanzados como JSONB y arrays, la capacidad de escribir funciones personalizadas, y su increíble extensibilidad. Aprenderás a modelar datos complejos de manera eficiente y a optimizar consultas para manejar grandes volúmenes de información. Este curso es para aquellos que buscan construir aplicaciones que no solo funcionen, sino que perduren y escalen con el tiempo.</p>",
        imageUrl: null,
        level: CourseLevel.INTERMEDIATE, status: CourseStatus.PUBLISHED, durationMonths: 1, studyDaysPerWeek: 5, studyHoursPerDay: 2,
        requirements: "Computadora con acceso a internet y conocimientos básicos de SQL.",
        additionalMaterialInfo: "Tendrás acceso a un VPS en producción para tus experimentos:\n- pgAdmin: https://pgadmin.percyalvarez.com\n- Webmin: https://154.53.42.52:10000\n- User: student\n- Pass: Academia2025$",
        aiSystemPrompt: commonAIPrompt,
      },
      tags: [{ slug: 'postgresql' }, { slug: 'bases-de-datos' }, { slug: 'backend' }],
      lessons: Array.from({ length: 20 }, (_, i) => ({
        title: `Día ${i + 1}: Lección de PostgreSQL`,
        content: `<p>Contenido detallado para la lección del día ${i + 1} de PostgreSQL.</p>`,
        order: i + 1,
      })),
      questions: Array.from({ length: 20 }, (_, i) => ({
        text: `Pregunta del Día ${i + 1}: ¿Qué tipo de dato en PostgreSQL es altamente eficiente para almacenar y consultar documentos JSON?`,
        options: [
          { text: "JSONB", isCorrect: true },
          { text: "JSON", isCorrect: false },
          { text: "TEXT", isCorrect: false },
          { text: "VARCHAR", isCorrect: false },
        ],
        order: i + 1,
        points: 10,
      })),
    },
    // 10. GitHub
    {
      title: "GitHub: Colaboración y Control de Versiones Maestro",
      payload: {
        shortDescription: "Domina Git y GitHub para gestionar tus proyectos y colaborar en equipos de cualquier tamaño.",
        description: "<h3>🐙 GitHub: Colaboración y Control de Versiones Maestro 🐙</h3><p>El control de versiones es una habilidad no negociable para cualquier desarrollador serio, y Git es el estándar de la industria. Este curso te llevará desde los conceptos básicos de Git hasta los flujos de trabajo colaborativos avanzados en GitHub. Aprenderás a crear repositorios, hacer commits, crear ramas y fusionar cambios. Pero no nos detendremos ahí. Exploraremos el poder de las Pull Requests para la revisión de código, gestionaremos conflictos como un profesional, y utilizaremos GitHub Actions para automatizar tus flujos de trabajo de CI/CD. Entenderás cómo contribuir a proyectos de código abierto y cómo gestionar tus propios proyectos de manera eficiente y profesional. Al final, GitHub no será solo un lugar donde guardas tu código, sino tu centro de operaciones para el desarrollo de software.</p>",
        imageUrl: null,
        level: CourseLevel.BEGINNER, status: CourseStatus.PUBLISHED, durationMonths: 1, studyDaysPerWeek: 5, studyHoursPerDay: 2,
        requirements: "Computadora con acceso a internet.",
        additionalMaterialInfo: null,
        aiSystemPrompt: commonAIPrompt,
      },
      tags: [{ slug: 'github' }, { slug: 'control-de-versiones' }, { slug: 'devops' }],
      lessons: Array.from({ length: 20 }, (_, i) => ({
        title: `Día ${i + 1}: Lección de GitHub`,
        content: `<p>Contenido detallado para la lección del día ${i + 1} de GitHub.</p>`,
        order: i + 1,
      })),
      questions: Array.from({ length: 20 }, (_, i) => ({
        text: `Pregunta del Día ${i + 1}: ¿Qué comando de Git se utiliza para crear una nueva rama?`,
        options: [
          { text: "git branch <nombre-rama>", isCorrect: false },
          { text: "git checkout -b <nombre-rama>", isCorrect: true },
          { text: "git new-branch <nombre-rama>", isCorrect: false },
          { text: "git commit -b <nombre-rama>", isCorrect: false },
        ],
        order: i + 1,
        points: 10,
      })),
    }
  ];

  for (const course of courses) {
    await upsertCourseWithContent(course);
  }

  // 5. Create Subscription Plans
  await prisma.subscriptionPlan.upsert({where: { name: 'Mensual Productivo' },update: {price: 24.99, isActive: true, durationMonths: 1, bonusMonths: 0},create: { name: 'Mensual Productivo', durationMonths: 1, price: 24.99, isActive: true },});
  await prisma.subscriptionPlan.upsert({where: { name: 'Trimestral Imparable' },update: {price: 64.99, isActive: true, durationMonths: 3, bonusMonths: 0},create: { name: 'Trimestral Imparable', durationMonths: 3, price: 64.99, isActive: true },});
  await prisma.subscriptionPlan.upsert({where: { name: 'Semestral Maestro (6+1)' },update: {price: 119.99, isActive: true, durationMonths: 6, bonusMonths: 1},create: { name: 'Semestral Maestro (6+1)', durationMonths: 6, bonusMonths: 1, price: 119.99, isActive: true },});
  await prisma.subscriptionPlan.upsert({where: { name: 'Anual Leyenda (12+2)' },update: {price: 199.99, isActive: true, durationMonths: 12, bonusMonths: 2},create: { name: 'Anual Leyenda (12+2)', durationMonths: 12, bonusMonths: 2, price: 199.99, isActive: true },});
  console.log('Planes de suscripción procesados.');

  console.log('Omitiendo creación de suscripción para el estudiante con fines de prueba.');
  console.log('Sembrado de datos para producción finalizado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
