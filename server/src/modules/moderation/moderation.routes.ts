import { Router } from 'express';
import { authenticate, type AuthRequest } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  assertModerator,
  blockUser,
  createReport,
  listReports,
  reportListQuerySchema,
  reportSchema,
  reportStatusSchema,
  unblockUser,
  updateReportStatus,
} from './moderation.service.js';

const router = Router();

router.get('/reports', authenticate, validate(reportListQuerySchema, 'query'), async (req: AuthRequest, res) => {
  await assertModerator(req.userId!);
  const reports = await listReports(req.query);
  res.json({ success: true, data: { reports } });
});

router.patch('/reports/:id/status', authenticate, validate(reportStatusSchema), async (req: AuthRequest, res) => {
  await assertModerator(req.userId!);
  const report = await updateReportStatus(req.params.id as string, req.body);
  res.json({ success: true, data: { report } });
});

router.post('/report', authenticate, validate(reportSchema), async (req: AuthRequest, res) => {
  const report = await createReport(req.userId!, req.body);
  res.status(201).json({ success: true, data: { report } });
});

router.post('/block/:userId', authenticate, async (req: AuthRequest, res) => {
  await blockUser(req.userId!, req.params.userId as string);
  res.json({ success: true, message: 'Usuário bloqueado.' });
});

router.delete('/block/:userId', authenticate, async (req: AuthRequest, res) => {
  await unblockUser(req.userId!, req.params.userId as string);
  res.json({ success: true, message: 'Usuário desbloqueado.' });
});

export default router;
