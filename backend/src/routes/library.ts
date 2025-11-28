import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateLibraryCode } from '../utils/codeGenerator';

const router = express.Router();
const prisma = new PrismaClient();

// Create library
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.userId!;

    if (!name) {
      return res.status(400).json({ error: 'Library name is required' });
    }

    // Generate unique code
    let code = generateLibraryCode();
    let codeExists = await prisma.library.findUnique({ where: { code } });

    // Ensure code is unique
    while (codeExists) {
      code = generateLibraryCode();
      codeExists = await prisma.library.findUnique({ where: { code } });
    }

    // Create library
    const library = await prisma.library.create({
      data: {
        name,
        description,
        code,
        createdBy: userId,
      },
    });

    // Add creator as owner
    const membership = await prisma.libraryMember.create({
      data: {
        libraryId: library.id,
        userId,
        role: 'owner',
      },
    });
    
    // DEBUG: Log library creation
    console.log('[DEBUG] Library created:', {
      libraryId: library.id,
      libraryName: library.name,
      createdBy: userId,
      membershipId: membership.id
    });

    const libraryWithMembers = await prisma.library.findUnique({
      where: { id: library.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(libraryWithMembers);
  } catch (error) {
    console.error('Create library error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join library by code
router.post('/join', authenticate, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    const userId = req.userId!;

    if (!code) {
      return res.status(400).json({ error: 'Library code is required' });
    }

    // Find library
    const library = await prisma.library.findUnique({
      where: { code },
    });

    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    // Check if already a member
    const existingMember = await prisma.libraryMember.findUnique({
      where: {
        libraryId_userId: {
          libraryId: library.id,
          userId,
        },
      },
    });

    if (existingMember) {
      // User is already a member - reset hasSeenWelcome to show welcome modal again
      await prisma.libraryMember.update({
        where: {
          libraryId_userId: {
            libraryId: library.id,
            userId,
          },
        },
        data: {
          hasSeenWelcome: false,
          joinedAt: new Date(), // Update joinedAt to reflect rejoin time
        },
      });
    } else {
      // Add as new member
      await prisma.libraryMember.create({
        data: {
          libraryId: library.id,
          userId,
          role: 'member',
          hasSeenWelcome: false, // Explicitly set to false for new members
        },
      });
    }

    const libraryWithMembers = await prisma.library.findUnique({
      where: { id: library.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json(libraryWithMembers);
  } catch (error) {
    console.error('Join library error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's libraries
router.get('/my-libraries', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    
    // DEBUG: Log the userId being used
    console.log('[DEBUG] /my-libraries - Requested by userId:', userId);

    // Get all library memberships for this specific user only
    const userMemberships = await prisma.libraryMember.findMany({
      where: {
        userId: userId, // Explicitly filter by the authenticated user's ID
      },
      select: {
        libraryId: true,
      },
    });

    // DEBUG: Log memberships found
    console.log('[DEBUG] /my-libraries - Found memberships:', userMemberships.length, 'for userId:', userId);

    // If user has no memberships, return empty array immediately
    if (userMemberships.length === 0) {
      console.log('[DEBUG] /my-libraries - No memberships found, returning empty array');
      return res.json([]);
    }

    // Extract only the library IDs this user is a member of
    const libraryIds = userMemberships.map(m => m.libraryId);

    // Safety check: if no library IDs, return empty
    if (libraryIds.length === 0) {
      console.log('[DEBUG] /my-libraries - No library IDs extracted, returning empty array');
      return res.json([]);
    }

    // DEBUG: Log library IDs
    console.log('[DEBUG] /my-libraries - Library IDs:', libraryIds);

    // Fetch ONLY libraries where this user is a member
    // Using explicit IN clause with the library IDs from memberships
    // This ensures users can ONLY see libraries they:
    // 1. Own (created - role: 'owner') OR
    // 2. Joined via code (role: 'member')
    const libraries = await prisma.library.findMany({
      where: {
        id: {
          in: libraryIds, // Only libraries where user has a membership record
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            photos: true,
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // DEBUG: Log libraries found
    console.log('[DEBUG] /my-libraries - Libraries found:', libraries.length);
    libraries.forEach(lib => {
      console.log(`[DEBUG] Library: ${lib.name} (${lib.id}), Members:`, lib.members.map(m => ({ userId: m.user.id, email: m.user.email })));
    });

    // Double-check: verify each library actually has this user as a member
    const verifiedLibraries = libraries.filter(library => {
      const isMember = library.members.some(member => member.user.id === userId);
      if (!isMember) {
        console.log(`[DEBUG] WARNING: Library ${library.id} (${library.name}) does not have userId ${userId} as a member!`);
      }
      return isMember;
    });

    console.log('[DEBUG] /my-libraries - Verified libraries:', verifiedLibraries.length);
    res.json(verifiedLibraries);
  } catch (error) {
    console.error('Get libraries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get library by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Check if user is a member
    const member = await prisma.libraryMember.findUnique({
      where: {
        libraryId_userId: {
          libraryId: id,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a member of this library' });
    }

    const library = await prisma.library.findUnique({
      where: { id },
      include: {
        members: {
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
        },
      },
    });

    // Include hasSeenWelcome for the current user
    res.json({
      ...library,
      currentMember: {
        hasSeenWelcome: member.hasSeenWelcome,
      },
    });
  } catch (error) {
    console.error('Get library error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark welcome modal as seen
router.post('/:id/mark-welcome-seen', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Check if user is a member
    const member = await prisma.libraryMember.findUnique({
      where: {
        libraryId_userId: {
          libraryId: id,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a member of this library' });
    }

    // Update hasSeenWelcome
    await prisma.libraryMember.update({
      where: {
        libraryId_userId: {
          libraryId: id,
          userId,
        },
      },
      data: {
        hasSeenWelcome: true,
      },
    });

    res.json({ message: 'Welcome modal marked as seen' });
  } catch (error) {
    console.error('Mark welcome seen error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member from library (owner only)
router.delete('/:id/members/:memberId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id: libraryId, memberId } = req.params;
    const userId = req.userId!;

    // Get library to check if user is the owner
    const library = await prisma.library.findUnique({
      where: { id: libraryId },
    });

    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    // Check if requester is the owner
    if (library.createdBy !== userId) {
      return res.status(403).json({ error: 'Only the library owner can remove members' });
    }

    // Check if the member exists
    const memberToRemove = await prisma.libraryMember.findUnique({
      where: {
        libraryId_userId: {
          libraryId,
          userId: memberId,
        },
      },
    });

    if (!memberToRemove) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Prevent owner from removing themselves
    if (memberToRemove.userId === userId) {
      return res.status(400).json({ error: 'Cannot remove yourself as the owner' });
    }

    // Remove the member
    await prisma.libraryMember.delete({
      where: {
        libraryId_userId: {
          libraryId,
          userId: memberId,
        },
      },
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;



