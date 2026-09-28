// ══════════════════════════════════════════════════════════════
// Rooms Service - Regras de Negócio para Salas de Áudio
// ══════════════════════════════════════════════════════════════

import { prisma } from '../../../config/database.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../shared/errors/AppError.js';
import { RoomServiceClient } from 'livekit-server-sdk';
import { env } from '../../../config/env.js';

const roomServiceLiveKit = new RoomServiceClient(env.LIVEKIT_URL, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);

export const roomsService = {
  /**
   * Lista todas as salas ativas ou agendadas.
   * IMPORTANTE: Cruza com o LiveKit para deletar salas-zumbi automaticamente.
   */
  async listRooms(cursor?: string) {
    // Auto-cleanup: delete any LIVE room older than 30 minutes (stale/ghost rooms)
    // AND delete any SCHEDULED room that was scheduled for more than 30 minutes ago but never started
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    await prisma.room.deleteMany({
      where: {
        OR: [
          { status: 'LIVE', startedAt: { lt: thirtyMinsAgo } },
          { status: 'SCHEDULED', scheduledAt: { lt: thirtyMinsAgo } }
        ]
      },
    }).catch(() => {});

    const rooms = await prisma.room.findMany({
      take: 50,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        status: { in: ['LIVE', 'SCHEDULED'] },
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        participantCount: true,
        maxParticipants: true,
        scheduledAt: true,
        startedAt: true,
        hostId: true,
        host: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Busca as salas realmente ativas no LiveKit
    let liveKitRoomNames: Set<string> = new Set();
    try {
      const lkRooms = await roomServiceLiveKit.listRooms();
      liveKitRoomNames = new Set(lkRooms.map((r: any) => r.name));
    } catch (err) {
      // Se não conseguir conectar ao LiveKit, retorna o que tem no banco sem filtrar
      console.warn('[listRooms] Falha ao consultar LiveKit, retornando dados do banco:', err);
      return rooms;
    }

    // Filtra e deleta salas-zumbi (LIVE no banco, mas inexistentes no LiveKit)
    const validRooms = [];
    for (const room of rooms) {
      if (room.status === 'LIVE' && room.startedAt) {
        const minutesSinceStart = (Date.now() - new Date(room.startedAt).getTime()) / 60000;
        if (minutesSinceStart > 1 && !liveKitRoomNames.has(room.id)) {
          // Sala-zumbi detectada! Deletar do banco de dados.
          console.log(`[listRooms] Sala-zumbi detectada e removida: ${room.id} (${room.title})`);
          await prisma.room.delete({ where: { id: room.id } }).catch(() => {});
          continue; // Não inclui na lista retornada
        }
      }
      validRooms.push(room);
    }

    return validRooms;
  },

  /**
   * Cria uma nova sala de áudio.
   */
  async createRoom(hostId: string, title: string, description?: string, scheduledAt?: Date) {
    const room = await prisma.room.create({
      data: {
        hostId,
        title: title.trim(),
        description: description?.trim(),
        scheduledAt,
        status: scheduledAt ? 'SCHEDULED' : 'LIVE',
        startedAt: scheduledAt ? null : new Date(),
        participantCount: 1, // O host já entra na sala
        participants: {
          create: [{ userId: hostId, isSpeaker: true }],
        },
      },
      include: {
        host: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    return room;
  },

  /**
   * Entra em uma sala existente.
   */
  async joinRoom(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundError('Sala');
    if (room.status === 'ENDED') throw new ConflictError('Esta sala já foi encerrada.');
    if (room.participantCount >= room.maxParticipants) throw new ConflictError('A sala está cheia.');

    const existing = await prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (existing) return { joined: true };

    await prisma.$transaction([
      prisma.roomParticipant.create({
        data: { roomId, userId, isSpeaker: false },
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { participantCount: { increment: 1 } },
      }),
    ]);

    return { joined: true };
  },

  /**
   * Sai de uma sala.
   */
  async leaveRoom(roomId: string, userId: string) {
    const existing = await prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!existing) return { left: true };

    await prisma.$transaction([
      prisma.roomParticipant.delete({
        where: { roomId_userId: { roomId, userId } },
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { participantCount: { decrement: 1 } },
      }),
    ]);

    return { left: true };
  },

  /**
   * Inicia uma sala agendada (somente host).
   */
  async startRoom(roomId: string, hostId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundError('Sala');
    if (room.hostId !== hostId) throw new ForbiddenError('Apenas o anfitrião pode iniciar a sala.');

    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'LIVE', startedAt: new Date() },
    });

    return { started: true };
  },

  /**
   * Encerra uma sala (somente host). Agora apaga definitivamente do banco.
   */
  async endRoom(roomId: string, hostId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundError('Sala');
    if (room.hostId !== hostId) throw new ForbiddenError('Apenas o anfitrião pode encerrar a sala.');

    // Apaga a sala (o cascade apaga os participantes no DB)
    await prisma.room.delete({
      where: { id: roomId },
    });

    // Encerra a sala no LiveKit
    try {
      await roomServiceLiveKit.deleteRoom(roomId);
    } catch (err) {
      console.warn('Falha ao encerrar sala no LiveKit (pode já estar vazia):', err);
    }

    return { ended: true };
  },

  /**
   * Promove um ouvinte para palestrante (speaker) na sala.
   */
  async approveSpeaker(roomId: string, hostId: string, targetUserId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundError('Sala');
    if (room.hostId !== hostId) throw new ForbiddenError('Apenas o anfitrião pode aprovar palestrantes.');

    // Promove no banco de dados
    await prisma.roomParticipant.update({
      where: { roomId_userId: { roomId: roomId, userId: targetUserId } },
      data: { isSpeaker: true },
    });

    // Promove no LiveKit
    try {
      await roomServiceLiveKit.updateParticipant(roomId, targetUserId, undefined, {
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });
    } catch (err) {
      console.error('Falha ao promover participante no LiveKit:', err);
      throw new ConflictError('Não foi possível atualizar as permissões de áudio.');
    }

    return { approved: true };
  },

  /**
   * Gera um token LiveKit para o usuário entrar na sala de áudio.
   */
  async getRoomToken(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { host: { select: { displayName: true } } } });
    if (!room) throw new NotFoundError('Sala não encontrada.');
    if (room.status === 'ENDED') throw new ConflictError('Esta sala já foi encerrada.');

    // Sincroniza com LiveKit para remover salas zumbis
    if (room.status === 'LIVE' && room.startedAt) {
      const minutesSinceStart = (new Date().getTime() - room.startedAt.getTime()) / 60000;
      if (minutesSinceStart > 1) { // Só deleta se a sala foi iniciada há mais de 1 minuto
        try {
          const lkRooms = await roomServiceLiveKit.listRooms([roomId]);
          let shouldDelete = false;
          
          if (lkRooms.length === 0) {
            shouldDelete = true;
          } else {
            const participants = await roomServiceLiveKit.listParticipants(roomId);
            const hostInRoom = participants.some(p => p.identity === room.hostId);
            if (!hostInRoom && userId !== room.hostId) {
              shouldDelete = true;
            }
          }

          if (shouldDelete) {
            await prisma.room.delete({ where: { id: roomId } });
            throw new ConflictError('O anfitrião encerrou ou saiu desta sala.');
          }
        } catch (err) {
          console.warn('Não foi possível verificar status no LiveKit, prosseguindo...', err);
        }
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true, avatarUrl: true } });
    const participantName = user?.displayName || 'Participante';

    const { AccessToken } = await import('livekit-server-sdk');
    const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity: userId,
      name: participantName,
      metadata: JSON.stringify({ avatarUrl: user?.avatarUrl }),
      ttl: '1h',
    });

    const isHost = room.hostId === userId;
    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: isHost,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return {
      token,
      roomId: room.id,
      roomName: room.title,
      livekitUrl: env.LIVEKIT_URL,
      isHost,
    };
  },
};
