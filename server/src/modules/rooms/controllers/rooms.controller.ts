// ══════════════════════════════════════════════════════════════
// Rooms Controller - Camada HTTP
// ══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { roomsService } from '../services/rooms.service.js';
import { AccessToken } from 'livekit-server-sdk';
import { env } from '../../../config/env.js';
import { prisma } from '../../../config/database.js';
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

  /**
   * Gera um token LiveKit para o usuário entrar na sala de áudio.
   * O token é de curta duração (1h) e contém as permissões de áudio.
   */
  async getRoomToken(req: AuthRequest, res: Response): Promise<void> {
    const roomId = req.params.id as string;
    const userId = req.userId!;

    // Verifica se a sala existe e está ativa
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { host: { select: { displayName: true } } } });
    if (!room) {
      res.status(404).json({ success: false, message: 'Sala não encontrada.' });
      return;
    }
    if (room.status === 'ENDED') {
      res.status(410).json({ success: false, message: 'Esta sala já foi encerrada.' });
      return;
    }

    // Busca o nome do usuário para identificar no LiveKit
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });
    const participantName = user?.displayName || 'Participante';

    // Gera o token de acesso assinado com a API Key e Secret do LiveKit
    const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity: userId,
      name: participantName,
      ttl: '1h',
    });

    // Define as permissões: pode publicar áudio e ouvir todos
    const isHost = room.hostId === userId;
    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: isHost, // Apenas o host fala por padrão; outros precisam de permissão
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    res.status(200).json({
      success: true,
      data: {
        token,
        roomId: room.id,
        roomName: room.title,
        livekitUrl: env.LIVEKIT_URL,
        isHost,
      },
    });
  },
};
