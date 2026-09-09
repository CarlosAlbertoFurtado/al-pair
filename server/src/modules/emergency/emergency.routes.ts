import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authenticate, type AuthRequest } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(8).max(20),
  relation: z.string().max(50).optional(),
  country: z.string().max(80).optional(),
  isPrimary: z.boolean().optional(),
});

router.get('/contacts', authenticate, async (req: AuthRequest, res) => {
  const contacts = await prisma.emergencyContact.findMany({
    where: { userId: req.userId! },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
  res.json({ success: true, data: { contacts } });
});

router.post('/contacts', authenticate, validate(contactSchema), async (req: AuthRequest, res) => {
  const userId = req.userId!;
  if (req.body.isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });
  }
  const contact = await prisma.emergencyContact.create({
    data: { userId, ...req.body },
  });
  res.status(201).json({ success: true, data: { contact } });
});

router.delete('/contacts/:id', authenticate, async (req: AuthRequest, res) => {
  await prisma.emergencyContact.deleteMany({
    where: { id: req.params.id as string, userId: req.userId! },
  });
  res.json({ success: true, message: 'Contato removido.' });
});

router.get('/resources', authenticate, async (_req, res) => {
  res.json({
    success: true,
    data: {
      hotlines: [
        { country: 'USA', name: 'Emergency', phone: '911' },
        { country: 'Brasil', name: 'SAMU', phone: '192' },
        { country: 'UK', name: 'Emergency', phone: '999' },
        { country: 'Global', name: 'AuPairConnect SOS', phone: '+1-800-AUPAIR-1' },
      ],
      tips: [
        'Mantenha contatos de emergência atualizados.',
        'Compartilhe sua localização com alguém de confiança.',
        'Use o chat para avisar sua agência em situações de rematch.',
      ],
    },
  });
});

export default router;
