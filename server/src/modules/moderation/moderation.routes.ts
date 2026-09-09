import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authenticate, type AuthRequest } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { ConflictError } from '../../shared/errors/AppError.js';

const router = Router();

const reportSchema = z.object({
  targetType: z.enum(['USER', 'POST', 'MESSAGE']),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
});

router.post('/report', authenticate, validate(reportSchema), async (req: AuthRequest, res) => {
  const report = await prisma.report.create({
    data: { reporterId: req.userId!, ...req.body },
  });
  res.status(201).json({ success: true, data: { report } });
});

router.post('/block/:userId', authenticate, async (req: AuthRequest, res) => {
  const blockerId = req.userId!;
  const blockedId = req.params.userId as string;
  if (blockerId === blockedId) throw new ConflictError('Não é possível bloquear a si mesmo.');

  await prisma.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId },
    update: {},
  });
  res.json({ success: true, message: 'Usuário bloqueado.' });
});

router.delete('/block/:userId', authenticate, async (req: AuthRequest, res) => {
  await prisma.userBlock.deleteMany({
    where: { blockerId: req.userId!, blockedId: req.params.userId as string },
  });
  res.json({ success: true, message: 'Usuário desbloqueado.' });
});

export default router;
