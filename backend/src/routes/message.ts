import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get heart messages for a library (only messages where user is sender or recipient)
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

    // Get messages where user is sender OR recipient (heart messages only, not photo comments)
    const messages = await prisma.message.findMany({
      where: { 
        libraryId,
        photoId: null, // Only heart messages, not photo comments
        OR: [
          { userId }, // User is the sender
          { recipients: { some: { userId } } }, // User is a recipient
        ],
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a heart message with recipients
router.post('/library/:libraryId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { libraryId } = req.params;
    const userId = req.userId!;
    const { content, recipientIds } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ error: 'At least one recipient is required' });
    }

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

    // Verify all recipients are members of the library
    const recipients = await prisma.libraryMember.findMany({
      where: {
        libraryId,
        userId: { in: recipientIds },
      },
    });

    if (recipients.length !== recipientIds.length) {
      return res.status(400).json({ error: 'One or more recipients are not members of this library' });
    }

    // Create message with recipients
    const message = await prisma.message.create({
      data: {
        libraryId,
        userId,
        content: content.trim(),
        recipients: {
          create: recipientIds.map((recipientId: string) => ({
            userId: recipientId,
          })),
        },
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

    res.json(message);
  } catch (error) {
    console.error('Create message error:', error);
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



