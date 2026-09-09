import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { authenticate, type AuthRequest } from '../../middleware/authenticate.js';

const router = Router();

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      data: data ? JSON.stringify(data) : null,
    },
  });
}

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: req.userId!, isRead: false },
  });
  res.json({ success: true, data: { notifications, unreadCount } });
});

router.post('/read-all', authenticate, async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.userId!, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true, message: 'Notificações marcadas como lidas.' });
});

router.patch('/:id/read', authenticate, async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id as string, userId: req.userId! },
    data: { isRead: true },
  });
  res.json({ success: true });
});

export default router;
