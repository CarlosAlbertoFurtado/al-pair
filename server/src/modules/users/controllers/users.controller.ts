// ══════════════════════════════════════════════════════════════
// Users Controller
// ══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { usersService } from '../services/users.service.js';
import type { AuthRequest } from '../../../middleware/authenticate.js';

export const usersController = {
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    const profile = await usersService.getProfile((req.params.id as string), req.userId);
    res.status(200).json({ success: true, data: { user: profile } });
  },

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    const user = await usersService.updateProfile(req.userId!, req.body);
    res.status(200).json({ success: true, data: { user } });
  },

  async toggleMentorMode(req: AuthRequest, res: Response): Promise<void> {
    const result = await usersService.toggleMentorMode(req.userId!);
    res.status(200).json({ success: true, data: result });
  },

  async toggleFollow(req: AuthRequest, res: Response): Promise<void> {
    const result = await usersService.toggleFollow(req.userId!, (req.params.id as string));
    res.status(200).json({ success: true, data: result });
  },

  async getNearbyUsers(req: AuthRequest, res: Response): Promise<void> {
    const { lat, lon, radius } = req.query;
    const users = await usersService.getNearbyUsers(
      parseFloat(lat as string),
      parseFloat(lon as string),
      radius ? parseFloat(radius as string) : undefined,
      undefined,
      req.userId
    );
    res.status(200).json({ success: true, data: { users } });
  },

  async updateLocation(req: AuthRequest, res: Response): Promise<void> {
    const { latitude, longitude } = req.body;
    await usersService.updateLocation(req.userId!, latitude, longitude);
    res.status(200).json({ success: true, message: 'Localização atualizada.' });
  },
};
