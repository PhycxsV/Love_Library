import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocketIO(io: Server) {
  // Authentication middleware for Socket.io
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join library room
    socket.on('join-library', async (libraryId: string) => {
      try {
        // Verify user is a member
        const member = await prisma.libraryMember.findUnique({
          where: {
            libraryId_userId: {
              libraryId,
              userId: socket.userId!,
            },
          },
        });

        if (member) {
          socket.join(`library:${libraryId}`);
          console.log(`User ${socket.userId} joined library ${libraryId}`);
        }
      } catch (error) {
        console.error('Join library error:', error);
      }
    });

    // Leave library room
    socket.on('leave-library', (libraryId: string) => {
      socket.leave(`library:${libraryId}`);
      console.log(`User ${socket.userId} left library ${libraryId}`);
    });

    // Send message (general library message)
    socket.on('send-message', async (data: { libraryId: string; content: string; photoId?: string; replyToId?: string | null }) => {
      try {
        const { libraryId, content, photoId, replyToId } = data;

        if (!content.trim()) {
          return;
        }

        // Verify user is a member
        const member = await prisma.libraryMember.findUnique({
          where: {
            libraryId_userId: {
              libraryId,
              userId: socket.userId!,
            },
          },
        });

        if (!member) {
          return;
        }

        // If photoId is provided, verify photo exists and belongs to library
        if (photoId) {
          const photo = await prisma.photo.findUnique({
            where: { id: photoId },
          });

          if (!photo || photo.libraryId !== libraryId) {
            return;
          }
        }

        // If replyToId is provided, verify it's a valid comment on the same photo/library
        if (replyToId) {
          const parentComment = await prisma.message.findUnique({
            where: { id: replyToId },
          });

          if (!parentComment || 
              parentComment.libraryId !== libraryId || 
              (photoId && parentComment.photoId !== photoId)) {
            return;
          }
        }

        // Save message to database
        const message = await prisma.message.create({
          data: {
            libraryId,
            photoId: photoId || null,
            replyToId: replyToId || null,
            userId: socket.userId!,
            content,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                profilePhoto: true,
              },
            },
          },
        });

        // Broadcast to all users in the library room
        if (photoId) {
          // Photo comment - emit to photo-specific event
          io.to(`library:${libraryId}`).emit('new-photo-comment', { photoId, comment: message });
        } else {
          // General library message
          io.to(`library:${libraryId}`).emit('new-message', message);
        }
      } catch (error) {
        console.error('Send message error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
}



