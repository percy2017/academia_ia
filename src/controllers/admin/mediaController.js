import prisma from '../../lib/prisma.js';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'media');

// Asegurarse de que el directorio de subida exista
const ensureUploadDirExists = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      console.log(`Directorio de subida creado en: ${UPLOAD_DIR}`);
    } else {
      console.error("Error al verificar/crear el directorio de subida:", error);
      throw error; // Re-lanzar el error si no es ENOENT
    }
  }
};

// Llamar a la función para asegurar que el directorio exista al iniciar el controlador
ensureUploadDirExists().catch(err => {
    console.error("Fallo crítico al inicializar el directorio de subida de media:", err);
    // Considerar terminar el proceso si el directorio es esencial y no se puede crear
    // process.exit(1); 
});


const mediaController = {
  getMediaLibrary: async (req, res) => {
    try {
      let files = await prisma.mediaFile.findMany({
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { id: true, name: true, email: true } } }
      });

      // Añadir la URL completa a cada archivo
      files = files.map(file => {
        const fullUrl = `${req.protocol}://${req.get('host')}/${file.path.replace(/\\/g, '/')}`;
        return { ...file, fullUrl };
      });

      const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB) || 50;

      // res.render('admin/media/index', { files, layout: 'layouts/admin' }); // El layout es main.ejs
      res.render('admin/media/index', { 
        files, 
        layout: 'layouts/main', // Especificamos el layout principal
        activeMenu: 'media', // Para resaltar en el sidebar si existe esa lógica
        maxFileSizeMB // Pasar el límite a la vista
      });
    } catch (error) {
      console.error("Error al obtener la librería multimedia:", error);
      req.flash('error_msg', 'Error al cargar la librería multimedia.');
      res.redirect('/admin/dashboard'); // O alguna otra página de error del admin
    }
  },

  uploadMediaFile: async (req, res) => {
    if (!req.files || req.files.length === 0) {
      req.flash('error_msg', 'No se seleccionaron archivos.');
      return res.redirect('/admin/media');
    }

    const uploadedFilesInfo = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const { filename, path: filePath, mimetype, size } = file;
        const storagePath = path.join('uploads', 'media', filename); // Ej: uploads/media/imagen.jpg

        const newMediaFile = await prisma.mediaFile.create({
          data: {
            filename,
            path: storagePath, // Ruta relativa al directorio public
            mimetype,
            size,
            userId: req.user?.id || null,
          },
        });
        uploadedFilesInfo.push(newMediaFile);
      } catch (error) {
        console.error(`Error al procesar el archivo ${file.originalname}:`, error);
        errors.push(`Error al guardar ${file.originalname}: ${error.message}`);
        // Intentar eliminar el archivo físico si se subió pero falló la BD
        if (file && file.path) {
          try {
            await fs.unlink(file.path);
            console.log(`Archivo ${file.path} eliminado debido a error en BD.`);
          } catch (unlinkError) {
            console.error(`Error al eliminar ${file.path} después de un fallo en la BD:`, unlinkError);
          }
        }
      }
    }

    if (errors.length > 0) {
      const errorMessage = errors.join('; ');
      if (uploadedFilesInfo.length > 0) {
        req.flash('warning_msg', `${uploadedFilesInfo.length} archivo(s) subido(s) correctamente. Errores: ${errorMessage}`);
      } else {
        req.flash('error_msg', `Error al subir archivos: ${errorMessage}`);
      }
    } else {
      req.flash('success_msg', `${uploadedFilesInfo.length} archivo(s) subido(s) correctamente.`);
    }
    
    res.redirect('/admin/media');
  },

  deleteMediaFile: async (req, res) => {
    const { id } = req.params;
    try {
      const fileToDelete = await prisma.mediaFile.findUnique({ where: { id } });

      if (!fileToDelete) {
        return res.status(404).json({ message: 'Archivo no encontrado.' });
      }

      // Eliminar el archivo físico del servidor
      // fileToDelete.path ahora es relativo al directorio 'public', ej: uploads/media/imagen.jpg
      // Necesitamos la ruta absoluta para fs.unlink, anteponiendo 'public'
      const absolutePath = path.join(process.cwd(), 'public', fileToDelete.path);
      
      try {
        await fs.unlink(absolutePath);
      } catch (unlinkError) {
        // Si el archivo no existe en el sistema de archivos pero sí en la BD,
        // puede que queramos solo borrar el registro de la BD.
        // Por ahora, registramos el error y continuamos para borrar de la BD.
        console.warn(`No se pudo eliminar el archivo físico ${absolutePath}, puede que ya no exista:`, unlinkError.message);
      }

      // Eliminar el registro de la base de datos
      await prisma.mediaFile.delete({ where: { id } });

      res.status(200).json({ message: 'Archivo eliminado correctamente.' }); // Mantenemos JSON para la llamada fetch
    } catch (error) {
      console.error("Error al eliminar el archivo multimedia:", error);
      res.status(500).json({ message: "Error al eliminar el archivo.", error: error.message }); // Mantenemos JSON
    }
  },
};

export default mediaController;
