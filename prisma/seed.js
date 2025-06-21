import { PrismaClient, CourseLevel, CourseStatus, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const generateSlug = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '').replace(/-+$/, ''); // Trim - from start and end
};

// --- Helper functions for lesson titles ---
function getDockerLessonTitle(day) {
  const titles = [
    "Despegue en Docker: Conceptos Clave y Arquitectura", "Tu Primer Contenedor: Instalación y Comandos Esenciales", "Imágenes Docker: El Arte de Construir y Compartir",
    "Gestión Avanzada de Contenedores: Ciclo de Vida y Operaciones", "Dockerfiles Maestros: Creando Entornos Perfectos", "Persistencia Heroica: Volúmenes y Bind Mounts",
    "Redes en Docker: Conectando tus Microservicios", "Docker Compose: Orquestando Sinfonías de Contenedores", "Registros Públicos y Privados: Tu Arsenal de Imágenes",
    "Fortaleza Docker: Estrategias de Seguridad en Contenedores", "Optimización Extrema: Imágenes Ligeras y Eficientes", "Docker Swarm: Orquestación Nativa Simplificada",
    "Kubernetes y Docker: Una Introducción a la Orquestación Avanzada", "Vigilancia y Diagnóstico: Monitoreo y Logging Efectivo", "CI/CD con Sabor a Docker: Automatizando tus Despliegues",
    "Docker en las Nubes: Despliegue en AWS, Azure y GCP", "Casos de Uso Épicos: Docker en el Mundo Real", "Resolviendo Enigmas: Troubleshooting en Docker",
    "El Flujo del Desarrollador Dockerizado", "Proyecto Final: Tu Aplicación Contenerizada Brillando"
  ];
  return titles[day - 1] || `Tema Avanzado de Docker ${day}`;
}

function getPHPLessonTitle(day) {
  const titles = [
    "PHP: El Renacimiento del Gigante Web y Tu Entorno de Desarrollo", "Sintaxis Fundamental: Variables, Tipos y Constantes", "Operadores y Expresiones: La Lógica de PHP",
    "Estructuras de Control: Forjando el Flujo de tu Aplicación", "Funciones: Bloques de Código Reutilizables y Poderosos", "Arrays en Profundidad: Colecciones Versátiles",
    "PHP Orientado a Objetos: Clases, Objetos y Encapsulamiento", "Herencia, Interfaces y Traits: Pilares de la POO Avanzada", "Formularios HTML y PHP: Recogiendo la Voz del Usuario (GET/POST)",
    "Validación y Saneamiento de Datos: Escudo Contra Entradas Maliciosas", "Sesiones y Cookies: Recordando a tus Usuarios", "Maestría en Ficheros: Lectura, Escritura y Gestión",
    "PDO: El Puente Universal a tus Bases de Datos", "CRUD con PDO: Dominando las Operaciones de Datos", "Manejo de Errores y Excepciones: Código a Prueba de Fallos",
    "Composer: Tu Aliado en la Gestión de Dependencias", "APIs REST con PHP: Creando Servicios Web Modernos", "Seguridad Web en PHP: Defiéndete de XSS, SQLi y Más",
    "Patrones de Diseño Clave en PHP", "Proyecto Final: Tu Aplicación Web PHP Lista para Conquistar"
  ];
  return titles[day - 1] || `Tema Avanzado de PHP ${day}`;
}

function getPythonLessonTitle(day) {
  const titles = [
    "Python Cósmico: Tu Lanzamiento al Universo del Código", "Variables, Tipos de Datos y Operadores: Los Átomos de Python", "Strings y Colecciones Fundamentales: Listas y Tuplas",
    "Diccionarios y Conjuntos: Estructuras de Datos Flexibles", "Control de Flujo: Condicionales y Bucles Estelares", "Funciones: Creando Nebulosas de Código Reutilizable",
    "Módulos y Paquetes: Importando Galaxias de Funcionalidades", "Programación Orientada a Objetos: Clases y Objetos Celestiales", "Herencia y Polimorfismo: Dinastías de Código en POO",
    "Explorando el Sistema de Archivos: Lectura y Escritura de Datos", "Manejo de Errores y Excepciones: Agujeros Negros y Cómo Evitarlos", "List Comprehensions y Generadores: Pythonicidad en Acción",
    "Viajando en el Tiempo: Módulo Datetime", "La Caja de Herramientas Estándar: os, sys, math, random", "Entornos Virtuales y Pip: Aislamiento y Gestión de Proyectos",
    "Primeros Pasos en la Web: Introducción a Flask", "Análisis de Datos con Pandas: Tablas y Series Superpoderosas", "Visualización de Datos con Matplotlib/Seaborn: Graficando el Universo",
    "Automatizando el Cosmos: Scripts de Python para Tareas Cotidianas", "Proyecto Final: Tu Constelación de Habilidades en Python"
  ];
  return titles[day - 1] || `Tema Avanzado de Python ${day}`;
}

function getJavaScriptLessonTitle(day) {
  const titles = [
    "JavaScript: El Big Bang de la Interactividad Web", "Variables, Tipos de Datos y Operadores: La Esencia de JS", "Control de Flujo: Condicionales y Bucles Dinámicos",
    "Funciones: Motores de Lógica Reutilizable", "El DOM: Manipulando el Universo HTML", "Eventos: La Respuesta de la Web a la Interacción",
    "Arrays y Objetos: Colecciones de Poder", "ES6+ Avanzado: Arrow Functions, Destructuring, Spread/Rest", "Programación Asíncrona: Promises y Async/Await",
    "APIs del Navegador: Fetch, LocalStorage y Más Allá", "Manejo de Errores y Debugging: Encontrando Quásares en tu Código", "Módulos en JavaScript: Organizando tu Cosmos de Código",
    "Introducción a Node.js: JavaScript del Lado del Servidor", "Frameworks Frontend (Conceptos): React, Angular, Vue", "Herramientas de Desarrollo Modernas: npm, Webpack, Babel",
    "Pruebas en JavaScript: Asegurando la Calidad de tu Galaxia", "Seguridad en el Frontend: Protegiendo tu Aplicación Espacial", "Optimización y Rendimiento: Haciendo tu Web Supersónica",
    "Patrones de Diseño en JavaScript", "Proyecto Final: Tu Aplicación Web Interactiva Deslumbrante"
  ];
  return titles[day - 1] || `Tema Avanzado de JavaScript ${day}`;
}

// Helper function to upsert course, its lessons, main quiz, and questions
async function upsertCourseWithLessonsAndQuiz(courseUniqueSlugOrTitle, coursePayload, lessonsPayload) {
  const searchSlug = generateSlug(courseUniqueSlugOrTitle);
  const course = await prisma.course.upsert({
    where: { slug: searchSlug },
    update: coursePayload,
    create: {
      ...coursePayload,
      lessons: { create: lessonsPayload },
      quizzes: { create: [{ title: `Cuestionario Principal - ${coursePayload.title}`, description: `Cuestionario principal para el curso ${coursePayload.title}.`, quizType: 'KNOWLEDGE_CHECK' }] }
    },
    include: { lessons: true, tags: true, quizzes: true },
  });
  console.log(`Upserted course: "${course.title}" with ${course.lessons.length} lessons.`);

  let mainQuiz = course.quizzes.find(q => q.title.startsWith('Cuestionario Principal'));
  if (!mainQuiz && course.id) {
      mainQuiz = await prisma.quiz.findFirst({where: {courseId: course.id, title: `Cuestionario Principal - ${course.title}`}});
      if(!mainQuiz){
          mainQuiz = await prisma.quiz.create({
              data: { title: `Cuestionario Principal - ${course.title}`, description: `Cuestionario principal para el curso ${course.title}.`, quizType: 'KNOWLEDGE_CHECK', courseId: course.id }
          });
          console.log(`Created main quiz for "${course.title}" as it was missing after upsert.`);
      }
  }
  
  if (mainQuiz) {
    for (const lesson of lessonsPayload) {
      await prisma.question.upsert({
        where: { quizId_order: { quizId: mainQuiz.id, order: lesson.order } },
        update: { text: `Pregunta actualizada para Lección ${lesson.order}: ${lesson.title}`, options: [{ text: "Opción Correcta (Actualizada)", isCorrect: true }, { text: "Opción B (Actualizada)", isCorrect: false }, { text: "Opción C (Actualizada)", isCorrect: false }], points: 1 },
        create: { quizId: mainQuiz.id, text: `Pregunta para Lección ${lesson.order}: ${lesson.title}`, options: [{ text: "Opción A (Correcta)", isCorrect: true }, { text: "Opción B", isCorrect: false }, { text: "Opción C", isCorrect: false }], order: lesson.order, points: 1 },
      });
    }
    console.log(`Upserted questions for quiz: "${mainQuiz.title}"`);
  } else {
    console.error(`Could not find or create main quiz for course "${course.title}". Questions not seeded.`);
  }
}

async function main() {
  console.log('Start seeding for production...');

  // 1. Upsert Users
  const adminPassword = await bcrypt.hash('adminprod123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@academiaai.com' }, update: { name: 'Administrador Principal', password: adminPassword, role: Role.ADMIN },
    create: { email: 'admin@academiaai.com', name: 'Administrador Principal', password: adminPassword, role: Role.ADMIN },
  });
  console.log(`Upserted admin user: admin@academiaai.com`);

  const studentPassword = await bcrypt.hash('studentprod123', 10);
  await prisma.user.upsert({
    where: { email: 'student@academiaai.com' }, update: { name: 'Estudiante de Prueba', password: studentPassword, role: Role.STUDENT },
    create: { email: 'student@academiaai.com', name: 'Estudiante de Prueba', password: studentPassword, role: Role.STUDENT },
  });
  console.log(`Upserted student user: student@academiaai.com`);

  // 2. Upsert Tags
  const tagWebDev = await prisma.tag.upsert({ where: { slug: 'desarrollo-web' }, update: {name: 'Desarrollo Web'}, create: { name: 'Desarrollo Web', slug: 'desarrollo-web' } });
  const tagDevOps = await prisma.tag.upsert({ where: { slug: 'devops' }, update: {}, create: { name: 'DevOps', slug: 'devops' } });
  const tagDocker = await prisma.tag.upsert({ where: { slug: 'docker' }, update: {}, create: { name: 'Docker', slug: 'docker' } });
  const tagPHP = await prisma.tag.upsert({ where: { slug: 'php' }, update: {}, create: { name: 'PHP', slug: 'php' } });
  const tagPython = await prisma.tag.upsert({ where: { slug: 'python' }, update: {}, create: { name: 'Python', slug: 'python' } });
  const tagJavaScript = await prisma.tag.upsert({ where: { slug: 'javascript' }, update: {}, create: { name: 'JavaScript', slug: 'javascript' } });
  const tagDataScience = await prisma.tag.upsert({ where: { slug: 'ciencia-de-datos'}, update: {name: 'Ciencia de Datos'}, create: { name: 'Ciencia de Datos', slug: 'ciencia-de-datos' }});
  const tagBackend = await prisma.tag.upsert({ where: { slug: 'backend'}, update: {name: 'Backend'}, create: { name: 'Backend', slug: 'backend' }});
  const tagFrontend = await prisma.tag.upsert({ where: { slug: 'frontend'}, update: {name: 'Frontend'}, create: { name: 'Frontend', slug: 'frontend' }});
  console.log('Upserted tags.');

  // --- Course Data ---
  const commonCourseMaterial = "El alumno tendrá acceso a un VPS en producción para realizar pruebas y experimentos.\nWebmin: https://154.53.42.52:10000\nUser: student\nPass: Academia2025$";
  const commonAIPrompt = "Eres MentorIA, un tutor experto y amigable para el curso '{{courseTitle}}'. Conoces el progreso del alumno: {{userName}} ({{userEmail}}) ha completado {{courseProgress}}% del curso y su último puntaje en quizzes es {{lastQuizScore}}%. Ayúdalo con sus dudas sobre la lección actual '{{lessonTitle}}', ofreciendo explicaciones claras, ejemplos de código si es pertinente, y motivándolo a continuar. Si la pregunta es muy general, intenta guiarlo hacia el contenido específico del curso o la lección actual. Sé paciente y didáctico.";
  const lessonsPerCourse = 20;

  // --- Docker Course ---
  const dockerCourseTitle = "Docker: Contenedores Sin Fronteras";
  const dockerLessons = [];
  for (let i = 1; i <= lessonsPerCourse; i++) {
    dockerLessons.push({
      title: `Día ${i}: ${getDockerLessonTitle(i)}`,
      content: `<p>Contenido detallado y creativo para la lección ${i} del curso de Docker: <strong>${getDockerLessonTitle(i)}</strong>.</p><p>En esta sesión, exploraremos a fondo los conceptos y prácticas esenciales para dominar este tema crucial en el mundo de la contenerización. Prepárate para sumergirte en ejemplos prácticos y escenarios del mundo real.</p>`,
      order: i,
    });
  }
  const dockerCoursePayload = {
    title: dockerCourseTitle,
    slug: generateSlug(dockerCourseTitle),
    shortDescription: "Domina Docker desde cero y despliega aplicaciones como un profesional. Aprende a construir, gestionar y orquestar contenedores para optimizar tus desarrollos.",
    description: `<h3>🚀 Docker: Contenedores Sin Fronteras - ¡Tu Pasaporte al Desarrollo Moderno! 🚀</h3>
    <p>¿Cansado de los "funciona en mi máquina"? ¿Listo para llevar tus habilidades de desarrollo y despliegue al siguiente nivel? Este curso intensivo de <strong>Docker</strong> es tu billete de entrada al mundo de la contenerización, una tecnología que ha revolucionado la forma en que construimos y distribuimos software.</p>
    <p>Durante un mes transformador, te guiaremos desde los conceptos más fundamentales hasta las técnicas avanzadas de orquestación. Aprenderás a empaquetar tus aplicaciones y todas sus dependencias en unidades portátiles y aisladas llamadas contenedores. Olvídate de los conflictos de versiones y los entornos inconsistentes; con Docker, la consistencia y la eficiencia son la norma.</p>
    <h4>🌌 ¿Qué Explorarás en esta Odisea Docker?</h4>
    <ul>
      <li><strong>Fundamentos Sólidos:</strong> Entenderás la arquitectura de Docker, el ciclo de vida de los contenedores y por qué son superiores a las máquinas virtuales para la mayoría de los casos de uso de aplicaciones.</li>
      <li><strong>Maestría en Imágenes:</strong> Crearás tus propias imágenes Docker personalizadas y optimizadas utilizando Dockerfiles. Aprenderás a publicarlas y gestionarlas en Docker Hub y registros privados.</li>
      <li><strong>Orquestación con Docker Compose:</strong> Simplificarás la gestión de aplicaciones multi-contenedor, definiendo y ejecutando entornos complejos con un solo comando.</li>
      <li><strong>Redes y Almacenamiento Persistente:</strong> Configurarás redes para que tus contenedores se comuniquen entre sí y aprenderás a manejar datos persistentes utilizando volúmenes.</li>
      <li><strong>Seguridad en Contenedores:</strong> Implementarás las mejores prácticas para asegurar tus contenedores y proteger tus aplicaciones.</li>
      <li><strong>Integración con CI/CD:</strong> Descubrirás cómo Docker se integra perfectamente en los flujos de trabajo de Integración Continua y Despliegue Continuo.</li>
    </ul>
    <p>Este curso no es solo teoría; tendrás acceso a un <strong>VPS en producción</strong> para realizar pruebas y experimentos, aplicando lo aprendido en un entorno real. Al finalizar, serás capaz de dockerizar cualquier aplicación, optimizar tus flujos de desarrollo y prepararte para tecnologías de orquestación más avanzadas como Kubernetes.</p>
    <p><strong>¡Únete ahora y desata el poder de los contenedores!</strong></p>`,
    imageUrl: 'http://localhost:4000/uploads/media/OIG1.jpg-1750402625611-909146209.jpg',
    level: CourseLevel.INTERMEDIATE, status: CourseStatus.PUBLISHED, durationMonths: 1,
    studyDaysPerWeek: 5, studyHoursPerDay: 2,
    requirements: "Computadora con acceso a internet. Se recomiendan conocimientos básicos de línea de comandos, pero no son estrictamente obligatorios.",
    additionalMaterialInfo: commonCourseMaterial,
    aiSystemPrompt: commonAIPrompt.replace('{{courseTitle}}', dockerCourseTitle),
    n8nWebhookUrl: 'https://n8n.percyalvarez.com/webhook/docker',
    tags: { connect: [{ slug: 'docker' }, { slug: 'devops' }] },
  };
  await upsertCourseWithLessonsAndQuiz(dockerCourseTitle, dockerCoursePayload, dockerLessons);

  // --- PHP Course ---
  const phpCourseTitle = "PHP: Arquitecto de la Web Dinámica";
  const phpLessons = [];
  for (let i = 1; i <= lessonsPerCourse; i++) {
    phpLessons.push({
      title: `Día ${i}: ${getPHPLessonTitle(i)}`,
      content: `<p>Contenido detallado y creativo para la lección ${i} del curso de PHP: <strong>${getPHPLessonTitle(i)}</strong>.</p><p>Sumérgete en el fascinante mundo de PHP y descubre cómo construir aplicaciones web robustas y escalables. Esta lección te proporcionará las herramientas y conocimientos necesarios.</p>`,
      order: i,
    });
  }
  const phpCoursePayload = {
    title: phpCourseTitle,
    slug: generateSlug(phpCourseTitle),
    shortDescription: "Conviértete en un maestro del backend con PHP. Desde la sintaxis esencial hasta la creación de APIs RESTful y la integración con bases de datos.",
    description: `<h3>💎 PHP: Arquitecto de la Web Dinámica - ¡Forja tu Imperio Digital! 💎</h3>
    <p>PHP, el lenguaje que impulsa una gran parte de la web, sigue siendo una herramienta increíblemente poderosa y relevante en el desarrollo moderno. Este curso completo te llevará de la mano durante un mes para que domines PHP, desde sus fundamentos más básicos hasta la construcción de aplicaciones web complejas, seguras y de alto rendimiento.</p>
    <p>Exploraremos la Programación Orientada a Objetos (POO) en PHP, cómo interactuar de forma segura y eficiente con bases de datos usando PDO, la gestión de sesiones de usuario, la implementación de medidas de seguridad cruciales y las mejores prácticas que te distinguirán como un desarrollador PHP profesional.</p>
    <h4>🛠️ ¿Qué Construirás y Dominarás?</h4>
    <ul>
      <li><strong>Fundamentos del Lenguaje:</strong> Variables, tipos de datos, operadores, estructuras de control, funciones y manejo de errores. ¡La base de todo gran programador PHP!</li>
      <li><strong>PHP Orientado a Objetos (POO):</strong> Clases, objetos, herencia, polimorfismo, interfaces y traits. Escribe código modular, reutilizable y fácil de mantener.</li>
      <li><strong>Interacción con Bases de Datos (PDO):</strong> Conecta tus aplicaciones a bases de datos como MySQL o PostgreSQL. Realiza operaciones CRUD (Crear, Leer, Actualizar, Eliminar) de forma segura.</li>
      <li><strong>Desarrollo de APIs RESTful:</strong> Aprende a diseñar y construir APIs que puedan ser consumidas por aplicaciones frontend (JavaScript, móviles) y otros servicios.</li>
      <li><strong>Seguridad Web Esencial:</strong> Protege tus aplicaciones contra las vulnerabilidades más comunes como Inyección SQL, Cross-Site Scripting (XSS) y CSRF.</li>
      <li><strong>Herramientas Modernas del Ecosistema PHP:</strong> Introducción a Composer para la gestión de dependencias y una visión general de cómo funcionan los frameworks populares como Laravel o Symfony.</li>
    </ul>
    <p>Con acceso a un <strong>VPS en producción</strong>, podrás poner en práctica cada concepto aprendido. Si aspiras a ser un desarrollador backend competente, crear tus propios temas o plugins para CMS como WordPress, o simplemente quieres entender cómo funciona la web por dentro, este curso de PHP es tu inversión más inteligente.</p>
    <p><strong>¡Inscríbete y empieza a codificar el futuro de la web!</strong></p>`,
    imageUrl: 'http://localhost:4000/uploads/media/_f7763ac3-ff3d-49a0-a719-4a0dc76e20f9.jpg-1750402625600-539998507.jpg',
    level: CourseLevel.INTERMEDIATE, status: CourseStatus.PUBLISHED, durationMonths: 1,
    studyDaysPerWeek: 5, studyHoursPerDay: 2,
    requirements: "Computadora con acceso a internet, editor de código (VS Code recomendado) y un entorno de desarrollo PHP local (XAMPP, WAMP, MAMP o Docker).",
    additionalMaterialInfo: commonCourseMaterial,
    aiSystemPrompt: commonAIPrompt.replace('{{courseTitle}}', phpCourseTitle),
    n8nWebhookUrl: 'https://n8n.percyalvarez.com/webhook/php',
    tags: { connect: [{ slug: 'php' }, { slug: 'desarrollo-web' }, { slug: 'backend' }] },
  };
  await upsertCourseWithLessonsAndQuiz(phpCourseTitle, phpCoursePayload, phpLessons);
  
  // --- Python Course ---
  const pythonCourseTitle = "Python: De Cero a Héroe del Código Versátil";
  const pythonLessons = [];
  for (let i = 1; i <= lessonsPerCourse; i++) {
    pythonLessons.push({
      title: `Día ${i}: ${getPythonLessonTitle(i)}`,
      content: `<p>Contenido detallado y creativo para la lección ${i} del curso de Python: <strong>${getPythonLessonTitle(i)}</strong>.</p><p>Python es tu llave para desbloquear un universo de posibilidades. En esta lección, daremos un paso más hacia la maestría de este lenguaje increíblemente versátil.</p>`,
      order: i,
    });
  }
  const pythonCoursePayload = {
    title: pythonCourseTitle,
    slug: generateSlug(pythonCourseTitle),
    shortDescription: "Desata el poder de Python. Aprende a programar desde lo básico y explora sus aplicaciones en desarrollo web, ciencia de datos y automatización.",
    description: `<h3>🐍 Python: De Cero a Héroe del Código Versátil - ¡Tu Aventura Multi-Dominio! 🐍</h3>
    <p>Python se ha consolidado como uno de los lenguajes de programación más populares y demandados del mundo, ¡y por una buena razón! Su sintaxis elegante, su vasta colección de bibliotecas y su increíble versatilidad lo hacen ideal para principiantes y expertos por igual. Este curso de un mes está diseñado para llevarte desde los fundamentos absolutos hasta la capacidad de construir proyectos Python significativos.</p>
    <p>No importa si tu interés radica en el desarrollo web, la ciencia de datos, el machine learning, la automatización de tareas o la ciberseguridad; Python te abre las puertas. Cubriremos la sintaxis esencial, la programación orientada a objetos, el manejo de archivos, la interacción con APIs y te introduciremos a algunas de las bibliotecas más influyentes del ecosistema Python.</p>
    <h4>🎯 ¿Qué Lograrás en este Viaje con Python?</h4>
    <ul>
      <li><strong>Dominio de los Fundamentos:</strong> Variables, tipos de datos, operadores, estructuras de control (condicionales y bucles), funciones y módulos.</li>
      <li><strong>Programación Orientada a Objetos (POO) en Python:</strong> Aprende a pensar en términos de objetos y clases para escribir código más organizado, modular y reutilizable.</li>
      <li><strong>Manipulación de Datos y Archivos:</strong> Trabaja con diferentes tipos de archivos (texto, CSV, JSON) y aprende las bases para el análisis de datos.</li>
      <li><strong>Introducción al Desarrollo Web:</strong> Descubre cómo Python se utiliza para construir aplicaciones web y APIs con frameworks como Flask o Django.</li>
      <li><strong>Automatización de Tareas:</strong> Escribe scripts para automatizar tareas repetitivas y hacer tu vida más fácil.</li>
      <li><strong>Vistazo a la Ciencia de Datos y Machine Learning:</strong> Entiende por qué Python es el lenguaje preferido en estos campos y conoce bibliotecas como NumPy, Pandas y Scikit-learn.</li>
    </ul>
    <p>Con el apoyo de un <strong>VPS en producción</strong> para tus prácticas, este curso te proporcionará una base sólida y la confianza para seguir explorando el vasto universo de Python. ¡Es hora de que te conviertas en un héroe del código!</p>
    <p><strong>¡Inscríbete y empieza a programar tu futuro con Python!</strong></p>`,
    imageUrl: 'http://localhost:4000/uploads/media/OIG2.1bWXVPXfgJZYbOJC8.jpg-1750404536229-89272098.jpg',
    level: CourseLevel.BEGINNER, status: CourseStatus.PUBLISHED, durationMonths: 1,
    studyDaysPerWeek: 5, studyHoursPerDay: 2,
    requirements: "Computadora con acceso a internet, editor de código (VS Code recomendado) y Python (versión 3.7 o superior) instalado.",
    additionalMaterialInfo: commonCourseMaterial,
    aiSystemPrompt: commonAIPrompt.replace('{{courseTitle}}', pythonCourseTitle),
    n8nWebhookUrl: 'https://n8n.percyalvarez.com/webhook/python',
    tags: { connect: [{ slug: 'python' }, { slug: 'desarrollo-web' }, { slug: 'ciencia-de-datos' }, {slug: 'backend'}] },
  };
  await upsertCourseWithLessonsAndQuiz(pythonCourseTitle, pythonCoursePayload, pythonLessons);

  // --- JavaScript Course ---
  const javaScriptCourseTitle = "JavaScript: El Alma Interactiva de la Web";
  const javaScriptLessons = [];
  for (let i = 1; i <= lessonsPerCourse; i++) {
    javaScriptLessons.push({
      title: `Día ${i}: ${getJavaScriptLessonTitle(i)}`,
      content: `<p>Contenido detallado y creativo para la lección ${i} del curso de JavaScript: <strong>${getJavaScriptLessonTitle(i)}</strong>.</p><p>JavaScript es el motor de la web moderna. En esta lección, profundizaremos en sus capacidades para crear experiencias de usuario dinámicas e interactivas.</p>`,
      order: i,
    });
  }
  const javaScriptCoursePayload = {
    title: javaScriptCourseTitle,
    slug: generateSlug(javaScriptCourseTitle),
    shortDescription: "Domina JavaScript, el lenguaje esencial de la web. Aprende desde la manipulación del DOM hasta conceptos avanzados de ES6+ y desarrollo frontend/backend.",
    description: `<h3>✨ JavaScript: El Alma Interactiva de la Web - ¡Crea Experiencias Asombrosas! ✨</h3>
    <p>JavaScript es el lenguaje de programación que da vida a la web. Si quieres crear sitios web interactivos, aplicaciones web dinámicas, o incluso aventurarte en el desarrollo de backend con Node.js, dominar JavaScript es absolutamente esencial. Este curso de un mes te sumergirá en el ecosistema de JavaScript, desde los fundamentos hasta las características modernas y las mejores prácticas.</p>
    <p>Aprenderás a manipular el Document Object Model (DOM) para cambiar dinámicamente el contenido y la apariencia de tus páginas, a manejar eventos del usuario, a trabajar con datos de forma asíncrona utilizando Promises y Async/Await, y a organizar tu código de manera eficiente. También exploraremos conceptos de ES6+ que han transformado la forma en que escribimos JavaScript.</p>
    <h4>💡 ¿Qué Iluminarás con tus Conocimientos de JavaScript?</h4>
    <ul>
      <li><strong>Fundamentos Sólidos del Lenguaje:</strong> Variables (let, const, var), tipos de datos, operadores, estructuras de control, funciones y scope.</li>
      <li><strong>Manipulación del DOM:</strong> Selecciona elementos HTML, modifica su contenido, atributos y estilos. Crea y elimina elementos dinámicamente.</li>
      <li><strong>Manejo de Eventos:</strong> Haz que tus páginas respondan a las acciones del usuario (clics, teclado, movimientos del ratón, etc.).</li>
      <li><strong>Programación Asíncrona:</strong> Entiende y utiliza Promises y Async/Await para manejar operaciones que toman tiempo, como peticiones a APIs (Fetch API).</li>
      <li><strong>JavaScript Moderno (ES6+):</strong> Arrow functions, template literals, destructuring, spread/rest operators, módulos y clases.</li>
      <li><strong>Introducción a Node.js y Frameworks Frontend:</strong> Comprende cómo JavaScript se extiende más allá del navegador y los conceptos básicos detrás de librerías/frameworks populares como React, Angular o Vue.</li>
    </ul>
    <p>Con el invaluable recurso de un <strong>VPS en producción</strong> para tus proyectos y experimentos, estarás más que preparado para enfrentar cualquier desafío de desarrollo web. Este curso es tu plataforma de lanzamiento para convertirte en un desarrollador JavaScript competente y creativo.</p>
    <p><strong>¡Inscríbete y empieza a programar la web del futuro, hoy mismo!</strong></p>`,
    imageUrl: 'http://localhost:4000/uploads/media/_fc0c8155-00e9-4ca3-9fef-74f48ecd6ded.jpg-1750474920160-222716170.jpg',
    level: CourseLevel.INTERMEDIATE, status: CourseStatus.PUBLISHED, durationMonths: 1,
    studyDaysPerWeek: 5, studyHoursPerDay: 2,
    requirements: "Computadora con acceso a internet y un editor de código (VS Code recomendado). Conocimientos básicos de HTML y CSS son muy recomendables.",
    additionalMaterialInfo: commonCourseMaterial,
    aiSystemPrompt: commonAIPrompt.replace('{{courseTitle}}', javaScriptCourseTitle),
    n8nWebhookUrl: 'https://n8n.percyalvarez.com/webhook/javascript',
    tags: { connect: [{ slug: 'javascript' }, { slug: 'desarrollo-web' }, { slug: 'frontend' }, { slug: 'backend' }] },
  };
  await upsertCourseWithLessonsAndQuiz(javaScriptCourseTitle, javaScriptCoursePayload, javaScriptLessons);

  // 5. Create Subscription Plans
  await prisma.subscriptionPlan.upsert({where: { name: 'Mensual Productivo' },update: {price: 24.99, isActive: true, durationMonths: 1, bonusMonths: 0},create: { name: 'Mensual Productivo', durationMonths: 1, price: 24.99, isActive: true },});
  await prisma.subscriptionPlan.upsert({where: { name: 'Trimestral Imparable' },update: {price: 64.99, isActive: true, durationMonths: 3, bonusMonths: 0},create: { name: 'Trimestral Imparable', durationMonths: 3, price: 64.99, isActive: true },});
  await prisma.subscriptionPlan.upsert({where: { name: 'Semestral Maestro (6+1)' },update: {price: 119.99, isActive: true, durationMonths: 6, bonusMonths: 1},create: { name: 'Semestral Maestro (6+1)', durationMonths: 6, bonusMonths: 1, price: 119.99, isActive: true },});
  await prisma.subscriptionPlan.upsert({where: { name: 'Anual Leyenda (12+2)' },update: {price: 199.99, isActive: true, durationMonths: 12, bonusMonths: 2},create: { name: 'Anual Leyenda (12+2)', durationMonths: 12, bonusMonths: 2, price: 199.99, isActive: true },});
  console.log('Upserted subscription plans.');
  
  // 6. Create a UserSubscription for the student
  const studentUser = await prisma.user.findUnique({where: {email: 'student@academiaai.com'}});
  const annualPlan = await prisma.subscriptionPlan.findUnique({where: {name: 'Anual Leyenda (12+2)'}});
  if (studentUser && annualPlan) {
      const subscriptionId = `seed_sub_${studentUser.id}_${annualPlan.id}_prod`;
      await prisma.userSubscription.upsert({
          where: { id: subscriptionId },
          update: { 
            endDate: new Date(new Date().setMonth(new Date().getMonth() + annualPlan.durationMonths + (annualPlan.bonusMonths || 0))), 
            isActive: true, 
          },
          create: { 
            id: subscriptionId, 
            userId: studentUser.id, 
            planId: annualPlan.id, 
            startDate: new Date(), 
            endDate: new Date(new Date().setMonth(new Date().getMonth() + annualPlan.durationMonths + (annualPlan.bonusMonths || 0))), 
            isActive: true, 
            paymentMethod: 'admin_grant_prod', 
            isPaymentVerified: true
          }
      });
      console.log(`Upserted active production subscription for ${studentUser.email} to plan ${annualPlan.name}`);
  }

  console.log('Seeding for production finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
