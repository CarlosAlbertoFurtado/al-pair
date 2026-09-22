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

    // Sincroniza com LiveKit: se a sala está LIVE no banco mas não existe no servidor (Zombie), limpa.
    if (room.status === 'LIVE' && room.startedAt) {
      const minutesSinceStart = (new Date().getTime() - room.startedAt.getTime()) / 60000;
      if (minutesSinceStart > 1) { // Só deleta se a sala foi iniciada há mais de 1 minuto
        try {
          const { RoomServiceClient } = await import('livekit-server-sdk');
          const rClient = new RoomServiceClient(env.LIVEKIT_URL, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
          const lkRooms = await rClient.listRooms([roomId]);
          if (lkRooms.length === 0) {
            // Sala fantasma! Ninguém no LiveKit, limpa do banco de dados.
            await prisma.room.delete({ where: { id: roomId } });
            res.status(410).json({ success: false, message: 'Esta sala já foi encerrada (limpeza automática).' });
            return;
          }
        } catch (err) {
          console.warn('Não foi possível verificar status no LiveKit, prosseguindo...', err);
        }
      }
    }

    // Busca o nome e avatar do usuário para identificar no LiveKit
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true, avatarUrl: true } });
    const participantName = user?.displayName || 'Participante';

    // Gera o token de acesso assinado com a API Key e Secret do LiveKit
    const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity: userId,
      name: participantName,
      metadata: JSON.stringify({ avatarUrl: user?.avatarUrl }),
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
