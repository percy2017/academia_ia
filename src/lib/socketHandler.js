import prisma from './prisma.js';
import { getAiResponse } from './aiService.js';
import { AIMessage } from '@langchain/core/messages';

export default function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // --- DEBUG: Check session on connection ---
    console.log('--- DEBUG on connection: Socket Session ---');
    console.log(socket.request.session);
    console.log('--- END DEBUG on connection ---');


    socket.on('joinRoom', ({ lessonId }) => {
      const sessionUser = socket.request.session?.user;
      if (!sessionUser) {
        console.error('Error: Unauthenticated user tried to join a room.');
        socket.emit('authError', { message: 'Authentication required to join a room.' });
        return;
      }
      const roomName = `${lessonId}-user-${sessionUser.id}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined private room ${roomName}`);
    });

    socket.on('sendMessage', async (data) => {
      // --- DEBUG: Check session on message ---
      console.log('--- DEBUG on message: Socket Session ---');
      console.log(socket.request.session);
      console.log('--- END DEBUG on message ---');

      // --- Security and Context Refactor ---
      // Get user from server-side session, NOT from client data
      const sessionUser = socket.request.session?.user;

      if (!sessionUser) {
        console.error('Error: Unauthenticated user tried to send a message.');
        // Optionally emit an error back to the specific socket
        socket.emit('authError', { message: 'Authentication required.' });
        return; // Stop processing
      }
      
      const userId = sessionUser.id; // Use the authenticated user's ID
      const { content, courseId, lessonId, fileUrl, fileType } = data; // `userId` from client is now ignored

      try {
        const message = await prisma.chatMessage.create({
          data: {
            content,
            userId, // Use validated userId from session
            courseId,
            lessonId,
            fileUrl,
            fileType,
          },
          include: {
            user: true,
          },
        });

        const roomName = `${lessonId}-user-${userId}`;
        io.to(roomName).emit('newMessage', message);

        // AI Agent Response Logic
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (course && course.aiProvider) { // Simplified check
          try {
            // Fetch context data for placeholders
            const user = sessionUser; // We already have the user object from the session
            const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
            const courseProgress = await prisma.userCourseProgress.findUnique({ where: { userId_courseId: { userId, courseId } } });
            const lastQuizAttempt = await prisma.quizAttempt.findFirst({
                where: { userId, quiz: { courseId } },
                orderBy: { createdAt: 'desc' }
            });

            // Process the system prompt
            let processedSystemPrompt = course.aiSystemPrompt || '';
            processedSystemPrompt = processedSystemPrompt.replace(/{{userName}}/g, user?.name || 'estudiante');
            processedSystemPrompt = processedSystemPrompt.replace(/{{userEmail}}/g, user?.email || 'email no disponible');
            processedSystemPrompt = processedSystemPrompt.replace(/{{courseTitle}}/g, course.title);
            processedSystemPrompt = processedSystemPrompt.replace(/{{lessonTitle}}/g, lesson?.title || 'lección actual');
            processedSystemPrompt = processedSystemPrompt.replace(/{{courseProgress}}/g, courseProgress?.progress || 0);
            processedSystemPrompt = processedSystemPrompt.replace(/{{lastQuizScore}}/g, lastQuizAttempt?.score ?? 'N/A');

            const courseConfig = {
                ...course,
                aiSystemPrompt: processedSystemPrompt,
            };

            // Fetch last 10 messages for context, filtered by user
            const chatHistory = await prisma.chatMessage.findMany({
              where: { 
                lessonId,
                userId // CRITICAL: Filter AI context by user
              },
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: { user: true }
            });
            chatHistory.reverse(); // Oldest first

            const aiResponseContent = await getAiResponse(
              content,
              chatHistory,
              courseConfig
            );

            const aiMessage = await prisma.chatMessage.create({
              data: {
                content: aiResponseContent,
                userId: 'ai-agent', // Special user ID for the AI agent
                courseId,
                lessonId,
                repliedToUserId: userId, // CRITICAL: Link AI message to the user
              },
              include: {
                user: true,
              },
            });
            const roomName = `${lessonId}-user-${userId}`;
            io.to(roomName).emit('newMessage', aiMessage);

          } catch (aiError) {
            console.error('Error getting AI response:', aiError);
            // Optionally, emit an error message to the user
            io.to(socket.id).emit('aiError', { message: 'El Agente IA no pudo responder. Inténtalo de nuevo más tarde.' });
          }
        }
      } catch (error) {
        console.error('Error saving or processing message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
