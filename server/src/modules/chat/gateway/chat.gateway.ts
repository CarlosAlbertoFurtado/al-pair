// ══════════════════════════════════════════════════════════════
// Chat Gateway - WebSocket com Socket.io
// Gerencia conexões em tempo real para chat instantâneo.
// ══════════════════════════════════════════════════════════════

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env.js';
import { chatService } from '../services/chat.service.js';
import { prisma } from '../../../config/database.js';

// ─── Tipos ─────────────────────────────────────────────────

interface AuthenticatedSocket extends Socket {
  userId: string;
}

// ─── Inicialização ─────────────────────────────────────────

export async function initializeChatGateway(httpServer: HttpServer): Promise<SocketServer> {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Redis Adapter (opcional) — WebSocket funciona mesmo sem Redis em dev
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const pubClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 5000,
    });
    const subClient = pubClient.duplicate();

    pubClient.on('error', () => {});
    subClient.on('error', () => {});

    await Promise.all([pubClient.connect(), subClient.connect()]);

    if (pubClient.status === 'ready' && subClient.status === 'ready') {
      io.adapter(createAdapter(pubClient, subClient));
      console.log('[WS] Redis adapter ativo.');
    }
  } catch {
    console.warn('[WS] Redis indisponível — Socket.io rodando sem adapter distribuído (modo single-node).');
  }


  // ─── Middleware de Autenticação do Socket ──────────────

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;

    if (!token) {
      return next(new Error('Token de autenticação necessário.'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };
      (socket as AuthenticatedSocket).userId = decoded.sub;
      next();
    } catch {
      next(new Error('Token inválido ou expirado.'));
    }
  });

  // ─── Eventos ──────────────────────────────────────────

  io.on('connection', async (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const userId = socket.userId;

    console.log(`[WS] Usuário conectado: ${userId}`);

    // Marcar online
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeenAt: new Date() },
    });

    // Entrar em todas as salas de conversa do usuário
    const conversations = await prisma.conversationUser.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    conversations.forEach(c => socket.join(`chat:${c.conversationId}`));

    // Sala pessoal (para notificações diretas)
    socket.join(`user:${userId}`);

    // ─── Enviar Mensagem ────────────────────────────────

    socket.on('message:send', async (data: { conversationId: string; content: string; imageUrl?: string }) => {
      try {
        const message = await chatService.sendMessage(
          data.conversationId,
          userId,
          data.content,
          data.imageUrl
        );

        // Broadcast para todos na sala (inclusive o sender, para confirmar)
        io.to(`chat:${data.conversationId}`).emit('message:new', {
          conversationId: data.conversationId,
          message,
        });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // ─── Indicador de Digitação ─────────────────────────

    socket.on('typing:start', async (data: { conversationId: string }) => {
      await chatService.setTyping(data.conversationId, userId, true);
      socket.to(`chat:${data.conversationId}`).emit('typing:update', {
        conversationId: data.conversationId,
        userId,
        isTyping: true,
      });
    });

    socket.on('typing:stop', async (data: { conversationId: string }) => {
      await chatService.setTyping(data.conversationId, userId, false);
      socket.to(`chat:${data.conversationId}`).emit('typing:update', {
        conversationId: data.conversationId,
        userId,
        isTyping: false,
      });
    });

    // ─── Marcar como Lido ───────────────────────────────

    socket.on('messages:read', async (data: { conversationId: string }) => {
      await prisma.conversationUser.update({
        where: { conversationId_userId: { conversationId: data.conversationId, userId } },
        data: { unreadCount: 0, lastReadAt: new Date() },
      });

      socket.to(`chat:${data.conversationId}`).emit('messages:read', {
        conversationId: data.conversationId,
        userId,
      });
    });

    // ─── Entrar em nova conversa ────────────────────────

    socket.on('conversation:join', (data: { conversationId: string }) => {
      socket.join(`chat:${data.conversationId}`);
    });

    // ─── Desconexão ─────────────────────────────────────

    socket.on('disconnect', async () => {
      console.log(`[WS] Usuário desconectado: ${userId}`);
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeenAt: new Date() },
      });
    });
  });

  return io;
}
