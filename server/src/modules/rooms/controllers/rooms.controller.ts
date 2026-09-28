// ══════════════════════════════════════════════════════════════
// Rooms Controller - Camada HTTP
// ══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { roomsService } from '../services/rooms.service.js';
import type { AuthRequest } from '../../../middleware/authenticate.js';

export const roomsController = {
  async listRooms(req: Request, res: Response): Promise<void> {
    const cursor = req.query.cursor as string | undefined;
    const rooms = await roomsService.listRooms(cursor);
    const nextCursor = rooms.length === 50 ? rooms[49].id : null;
    res.status(200).json({ success: true, data: { rooms, nextCursor } });
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

  async approveSpeaker(req: AuthRequest, res: Response): Promise<void> {
    const { participantId } = req.body;
    if (!participantId) {
      res.status(400).json({ success: false, message: 'participantId é obrigatório' });
      return;
    }
    const result = await roomsService.approveSpeaker((req.params.id as string), req.userId!, participantId);
    res.status(200).json({ success: true, data: result });
  },

  /**
   * Gera um token LiveKit para o usuário entrar na sala de áudio.
   * Toda a lógica de negócio foi movida para roomsService.getRoomToken.
   */
  async getRoomToken(req: AuthRequest, res: Response): Promise<void> {
    const data = await roomsService.getRoomToken(req.params.id as string, req.userId!);
    res.status(200).json({ success: true, data });
  },
};
