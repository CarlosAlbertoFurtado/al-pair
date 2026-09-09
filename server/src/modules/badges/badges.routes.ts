import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { authenticate, type AuthRequest } from '../../middleware/authenticate.js';

const router = Router();

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const [user, earned, allBadges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.badge.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const earnedIds = new Set(earned.map((e) => e.badgeId));
  res.json({
    success: true,
    data: {
      xp: user?.xp ?? 0,
      level: user?.level ?? 1,
      earned,
      available: allBadges.filter((b) => !earnedIds.has(b.id)),
    },
  });
});

export default router;
