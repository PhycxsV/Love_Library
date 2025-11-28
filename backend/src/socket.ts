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

    // Send message (heart message with recipients OR photo comment)
    socket.on('send-message', async (data: { libraryId: string; content: string; photoId?: string; replyToId?: string | null; recipientIds?: string[] }) => {
      try {
        const { libraryId, content, photoId, replyToId, recipientIds } = data;

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

        // If photoId is provided, verify photo exists and belongs to library (photo comment)
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

        // For heart messages (no photoId), require recipients
        if (!photoId && (!recipientIds || recipientIds.length === 0)) {
          return;
        }

        // Verify recipients are members (for heart messages)
        if (!photoId && recipientIds) {
          const recipients = await prisma.libraryMember.findMany({
            where: {
              libraryId,
              userId: { in: recipientIds },
            },
          });

          if (recipients.length !== recipientIds.length) {
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
            // Add recipients for heart messages
            ...(recipientIds && recipientIds.length > 0 && {
              recipients: {
                create: recipientIds.map((recipientId: string) => ({
                  userId: recipientId,
                })),
              },
            }),
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
            recipients: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    profilePhoto: true,
                  },
                },
              },
            },
          },
        });

        // Broadcast to specific users (recipients + sender) for heart messages
        if (photoId) {
          // Photo comment - emit to photo-specific event
          io.to(`library:${libraryId}`).emit('new-photo-comment', { photoId, comment: message });
        } else {
          // Heart message - emit only to sender and recipients
          const userIdsToNotify = [socket.userId!, ...recipientIds];
          userIdsToNotify.forEach((uid) => {
            io.to(`library:${libraryId}`).emit('new-heart-message', message);
          });
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



