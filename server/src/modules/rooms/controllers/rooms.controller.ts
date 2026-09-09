// ══════════════════════════════════════════════════════════════
// Rooms Controller - Camada HTTP
// ══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { roomsService } from '../services/rooms.service.js';
import type { AuthRequest } from '../../../middleware/authenticate.js';

export const roomsController = {
  async listRooms(_req: Request, res: Response): Promise<void> {
    const rooms = await roomsService.listRooms();
    res.status(200).json({ success: true, data: { rooms } });
  },

  async createRoom(req: AuthRequest, res: Response): Promise<void> {
    const { title, description, scheduledAt } = req.body;
    const room = await roomsService.createRoom(
      req.userId!,
      title,
      description,
      scheduledAt ? new Date(scheduledAt) : undefined
    );
    res.status(201).json({ success: true, data: { room } });
  },

  async joinRoom(req: AuthRequest, res: Response): Promise<void> {
    const result = await roomsService.joinRoom((req.params.id as string), req.userId!);
    res.status(200).json({ success: true, data: result });
  },

  async leaveRoom(req: AuthRequest, res: Response): Promise<void> {
    const result = await roomsService.leaveRoom((req.params.id as string), req.userId!);
    res.status(200).json({ success: true, data: result });
  },

  async startRoom(req: AuthRequest, res: Response): Promise<void> {
    const result = await roomsService.startRoom((req.params.id as string), req.userId!);
    res.status(200).json({ success: true, data: result });
  },

  async endRoom(req: AuthRequest, res: Response): Promise<void> {
    const result = await roomsService.endRoom((req.params.id as string), req.userId!);
    res.status(200).json({ success: true, data: result });
  },
};
