import prisma from '../lib/prisma.js';

export const getChatHistory = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.session.user?.id;

    if (!userId) {
      // Permitir ver el historial si no está logueado, pero estará vacío.
      // Opcional: podrías querer enviar un 401 si el historial es estrictamente privado.
      return res.json([]); 
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        lessonId,
        // Un mensaje es relevante si el usuario lo envió O si la IA le respondió a él.
        OR: [
          { senderId: userId },
          { repliedToUserId: userId }
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener el historial.' });
  }
};

export const uploadChatFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const mediaFile = await prisma.mediaFile.create({
      data: {
        filename: req.file.filename,
        path: `/uploads/media/${req.file.filename}`,
        mimetype: req.file.mimetype,
        size: req.file.size,
        userId: req.session.user.id,
      },
    });

    res.json({
      fileUrl: mediaFile.path,
      fileType: mediaFile.mimetype,
    });
  } catch (error) {
    console.error('Error saving media file:', error);
    res.status(500).json({ error: 'Error saving media file' });
  }
};
