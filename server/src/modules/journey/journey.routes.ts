import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { authenticate, type AuthRequest } from '../../middleware/authenticate.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const tasks = await prisma.journeyTask.findMany({ orderBy: { sortOrder: 'asc' } });
  const progress = await prisma.userJourneyItem.findMany({ where: { userId } });
  const progressMap = new Map(progress.map((p) => [p.taskId, p]));

  const items = tasks.map((task) => ({
    ...task,
    completed: progressMap.get(task.id)?.completed ?? false,
    completedAt: progressMap.get(task.id)?.completedAt ?? null,
  }));

  const completedCount = items.filter((i) => i.completed).length;
  res.json({
    success: true,
    data: {
      items,
      progress: {
        completed: completedCount,
        total: items.length,
        percent: items.length ? Math.round((completedCount / items.length) * 100) : 0,
      },
    },
  });
});

router.post('/:taskId/toggle', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const taskId = req.params.taskId as string;
  const task = await prisma.journeyTask.findUnique({ where: { id: taskId } });
  if (!task) {
    res.status(404).json({ success: false, message: 'Tarefa não encontrada.' });
    return;
  }

  const existing = await prisma.userJourneyItem.findUnique({
    where: { userId_taskId: { userId, taskId } },
  });

  if (existing?.completed) {
    await prisma.userJourneyItem.update({
      where: { id: existing.id },
      data: { completed: false, completedAt: null },
    });
    res.json({ success: true, data: { completed: false } });
    return;
  }

  const item = await prisma.userJourneyItem.upsert({
    where: { userId_taskId: { userId, taskId } },
    create: { userId, taskId, completed: true, completedAt: new Date() },
    update: { completed: true, completedAt: new Date() },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: task.xpReward } },
  });

  res.json({ success: true, data: { completed: true, item } });
});

export default router;
