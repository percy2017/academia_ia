import prisma from '../lib/prisma.js';

export const getChatHistory = async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.session.user.id; // Obtener el ID del usuario de la sesión

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const messages = await prisma.chatMessage.findMany({
      where: {
        lessonId,
        OR: [
          { userId: userId }, // Mensajes enviados por el usuario.
          { repliedToUserId: userId } // Mensajes de la IA en respuesta a este usuario.
        ]
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Error fetching chat history' });
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
