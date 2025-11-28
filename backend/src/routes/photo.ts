import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../utils/cloudinary';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Upload photo
router.post('/', authenticate, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { libraryId, description, isHighlight } = req.body;
    const userId = req.userId!;
    const file = req.file;

    if (!libraryId) {
      return res.status(400).json({ error: 'Library ID is required' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Check if user is a member of the library
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

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(file.buffer, file.mimetype);

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        libraryId,
        userId,
        imageUrl,
        description: description || null,
        isHighlight: isHighlight === 'true' || isHighlight === true,
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

    res.status(201).json(photo);
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get photos for a library
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

    const photos = await prisma.photo.findMany({
      where: { libraryId },
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
        createdAt: 'desc',
      },
    });

    res.json(photos);
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get highlights for a library
router.get('/library/:libraryId/highlights', authenticate, async (req: AuthRequest, res) => {
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

    const highlights = await prisma.photo.findMany({
      where: { 
        libraryId,
        isHighlight: true,
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
        createdAt: 'desc',
      },
    });

    res.json(highlights);
  } catch (error) {
    console.error('Get highlights error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete photo
// When a photo is deleted, all comments and replies are also deleted (cascade)
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const photo = await prisma.photo.findUnique({
      where: { id },
      include: {
        comments: true, // Get comments to verify they exist
      },
    });

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Only owner can delete
    if (photo.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this photo' });
    }

    // Delete all comments and replies associated with this photo
    // This is explicit, though cascade should handle it automatically
    await prisma.message.deleteMany({
      where: {
        photoId: id, // Delete all messages (comments) on this photo
      },
    });

    // Delete the photo itself
    // This will also cascade delete any remaining related data
    await prisma.photo.delete({
      where: { id },
    });

    res.json({ message: 'Photo deleted successfully along with all comments and replies' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;



