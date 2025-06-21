import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio de subida para avatares
const avatarUploadDirectory = path.join(__dirname, '../../public/uploads/avatars');

// Asegurarse de que el directorio de subida exista
if (!fs.existsSync(avatarUploadDirectory)) {
  fs.mkdirSync(avatarUploadDirectory, { recursive: true });
}

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarUploadDirectory);
  },
  filename: function (req, file, cb) {
    // Usar el ID del usuario (si está disponible) y un timestamp para evitar colisiones de nombres
    // y facilitar la asociación del archivo. El ID del usuario se podría añadir a req por un middleware anterior.
    // Por ahora, usaremos un timestamp y el nombre original.
    // Una mejor práctica sería usar req.session.user.id si está disponible en este punto.
    const userId = req.session?.user?.id || 'unknown_user';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, userId + '-' + file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Filtro de archivos para aceptar solo imágenes
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('¡Solo se permiten archivos de imagen!'), false);
  }
};

// Configuración de Multer para Avatares
const uploadAvatar = multer({ 
  storage: storage, // Reutiliza el storage de avatares definido arriba
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 2 // Límite de 2MB para avatares
  }
});

// --- Configuración para Imágenes de Cursos ---

// Directorio de subida para imágenes de cursos
const courseImageUploadDirectory = path.join(__dirname, '../../public/uploads/courses');

// Asegurarse de que el directorio de subida exista
if (!fs.existsSync(courseImageUploadDirectory)) {
  fs.mkdirSync(courseImageUploadDirectory, { recursive: true });
}

// Configuración de almacenamiento para imágenes de cursos
const courseImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, courseImageUploadDirectory);
  },
  filename: function (req, file, cb) {
    // Usar un nombre único para la imagen del curso
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    // Podríamos usar el slug del curso si estuviera disponible aquí, o el ID al editar.
    // Por ahora, un nombre genérico único.
    cb(null, 'course-' + uniqueSuffix + extension);
  }
});

// Configuración de Multer para Imágenes de Cursos
const uploadCourseImage = multer({
  storage: courseImageStorage,
  fileFilter: imageFileFilter, // Reutilizar el mismo filtro de imagen
  limits: {
    fileSize: 1024 * 1024 * 5 // Límite de 5MB para imágenes de cursos
  }
});

export { uploadAvatar, uploadCourseImage };
