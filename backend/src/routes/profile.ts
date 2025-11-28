import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../utils/cloudinary';

const router = express.Router();
const prisma = new PrismaClient();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Upload profile photo
router.post('/photo', authenticate, upload.single('photo'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.userId!;

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary credentials not configured');
      return res.status(500).json({ 
        error: 'Image upload service not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.' 
      });
    }

    // Log configuration status (without exposing secrets)
    console.log('Cloudinary config check:', {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
      apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing',
    });

    // Upload to Cloudinary
    let imageUrl: string;
    try {
      imageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    } catch (cloudinaryError: any) {
      console.error('Cloudinary upload error:', cloudinaryError);
      return res.status(500).json({ 
        error: cloudinaryError.message || 'Failed to upload image to cloud storage' 
      });
    }

    // Update user profile photo
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { profilePhoto: imageUrl },
        select: {
          id: true,
          email: true,
          username: true,
          profilePhoto: true,
          createdAt: true,
        },
      });

      res.json({ user });
    } catch (dbError: any) {
      console.error('Database update error:', dbError);
      return res.status(500).json({ error: 'Failed to update profile photo in database' });
    }
  } catch (error: any) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to upload profile photo. Please try again.' 
    });
  }
});

export default router;


