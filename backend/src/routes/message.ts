import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get messages for a library (general messages, not photo comments)
router.get('/library/:libraryId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { libraryId } = req.params;
    const userId = req.userId!;

    // Check if user is a member
    const member = await prisma.libraryMember.findUnique({
      where: {
        libraryId_userId: {
          libraryId,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a member of this library' });
    }

    const messages = await prisma.message.findMany({
      where: { 
        libraryId,
        photoId: null, // Only general library messages, not photo comments
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comments for a photo
router.get('/photo/:photoId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { photoId } = req.params;
    const userId = req.userId!;

    // Get photo to check library membership
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        library: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (photo.library.members.length === 0) {
      return res.status(403).json({ error: 'Not a member of this library' });
    }

    const comments = await prisma.message.findMany({
      where: { photoId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            profilePhoto: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(comments);
  } catch (error) {
    console.error('Get photo comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;



