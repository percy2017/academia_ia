import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Usamos fs síncrono para verificar/crear directorio en la configuración de Multer

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'media');

// Asegurarse de que el directorio de subida exista (sincrónico para la configuración de Multer)
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Directorio de subida para Multer creado en: ${UPLOAD_DIR}`);
  }
} catch (error) {
  console.error("Error al verificar/crear el directorio de subida para Multer:", error);
  // Podríamos lanzar un error aquí para detener la aplicación si el directorio es crítico
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // Crear un nombre de archivo único para evitar colisiones y problemas con caracteres especiales
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 50); // Limitar y sanitizar
    cb(null, sanitizedOriginalName + '-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  // Aceptar solo ciertos tipos de archivo (ejemplo: imágenes, videos, pdfs)
  // Puedes expandir esta lista según tus necesidades
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes, videos y documentos comunes.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024 // Lee de .env o usa 50MB por defecto
  }
});

export { upload };
