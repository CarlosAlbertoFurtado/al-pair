// ══════════════════════════════════════════════════════════════
// Agencies Controller
// ══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { agenciesService } from '../services/agencies.service.js';
import type { AuthRequest } from '../../../middleware/authenticate.js';

export const agenciesController = {
  async list(_req: Request, res: Response): Promise<void> {
    const agencies = await agenciesService.listAgencies();
    res.status(200).json({ success: true, data: { agencies } });
  },

  async getDetail(req: Request, res: Response): Promise<void> {
    const agency = await agenciesService.getAgencyDetail((req.params.id as string));
    res.status(200).json({ success: true, data: { agency } });
  },

  async addReview(req: AuthRequest, res: Response): Promise<void> {
    const { rating, title, content } = req.body;
    const review = await agenciesService.addReview(
      (req.params.id as string),
      req.userId!,
      rating,
      title,
      content
    );
    res.status(201).json({ success: true, data: { review } });
  },
};
