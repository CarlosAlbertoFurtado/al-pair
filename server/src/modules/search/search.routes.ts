import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { optionalAuth, type AuthRequest } from '../../middleware/authenticate.js';
import { visiblePostWhere, visibleUserWhere } from '../moderation/moderation.service.js';

const router = Router();

router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) {
    res.json({ success: true, data: { users: [], posts: [], agencies: [] } });
    return;
  }

  const [users, posts, agencies] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...visibleUserWhere(req.userId),
        OR: [
          { displayName: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { country: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        city: true,
        country: true,
        isMentorActive: true,
      },
      take: 20,
    }),
    prisma.post.findMany({
      where: {
        ...visiblePostWhere(req.userId),
        OR: [
          { content: { contains: q, mode: 'insensitive' } },
          { rematchCity: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        content: true,
        type: true,
        imageUrl: true,
        createdAt: true,
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.agency.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { country: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
    }),
  ]);

  res.json({ success: true, data: { users, posts, agencies } });
});

export default router;
