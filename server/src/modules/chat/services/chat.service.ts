// ══════════════════════════════════════════════════════════════
// Chat Service - Lógica de Conversas e Mensagens
// ══════════════════════════════════════════════════════════════

import { prisma } from '../../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError.js';
import { createNotification } from '../../notifications/notifications.routes.js';

// ─── Service ───────────────────────────────────────────────

export const chatService = {
  /**
   * Busca todas as conversas do usuário, ordenadas pela última mensagem.
   */
  async getConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      select: {
        id: true,
        isGroup: true,
        groupName: true,
        groupAvatarUrl: true,
        lastMessageAt: true,
        lastMessagePreview: true,
        participants: {
          select: {
            userId: true,
            unreadCount: true,
            isTyping: true,
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                isOnline: true,
                lastSeenAt: true,
                role: true,
                isMentorActive: true,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    });

    // Para cada conversa, calcular dados relativos ao viewer
    return conversations.map(conv => {
      const myParticipant = conv.participants.find(p => p.userId === userId);
      const otherParticipants = conv.participants.filter(p => p.userId !== userId);
      
      return {
        id: conv.id,
        isGroup: conv.isGroup,
        groupName: conv.groupName,
        groupAvatarUrl: conv.groupAvatarUrl,
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.lastMessagePreview,
        unreadCount: myParticipant?.unreadCount ?? 0,
        otherParticipants: otherParticipants.map(p => ({
          ...p.user,
          isTyping: p.isTyping,
        })),
      };
    });
  },

  /**
   * Busca mensagens de uma conversa (paginação por cursor).
   */
  async getMessages(conversationId: string, userId: string, cursor?: string) {
    // Verificar se o usuário faz parte da conversa
    const membership = await prisma.conversationUser.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!membership) throw new ForbiddenError('Você não faz parte desta conversa.');

    const limit = 30;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        audioUrl: true,
        status: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = messages.length > limit;
    const results = hasMore ? messages.slice(0, limit) : messages;

    // Marcar mensagens como lidas
    await prisma.conversationUser.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });

    return {
      messages: results.reverse(), // Cronológica (mais antigas primeiro)
      nextCursor: hasMore ? results[0].id : null,
      hasMore,
    };
  },

  /**
   * Envia uma mensagem numa conversa existente.
   * Atualiza os contadores de não-lidas dos outros participantes.
   */
  async sendMessage(conversationId: string, senderId: string, content: string, imageUrl?: string) {
    // Verificar participação
    const membership = await prisma.conversationUser.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!membership) throw new ForbiddenError('Você não faz parte desta conversa.');

    const preview = content.length > 60 ? content.substring(0, 57) + '...' : content;

    const [message] = await prisma.$transaction([
      // Criar mensagem
      prisma.message.create({
        data: {
          conversationId,
          senderId,
          content: content.trim(),
          imageUrl,
        },
        select: {
          id: true,
          content: true,
          imageUrl: true,
          audioUrl: true,
          status: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      // Atualizar preview da conversa
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: preview,
        },
      }),
      // Incrementar unread dos outros participantes
      prisma.conversationUser.updateMany({
        where: {
          conversationId,
          userId: { not: senderId },
        },
        data: {
          unreadCount: { increment: 1 },
        },
      }),
    ]);

    const others = await prisma.conversationUser.findMany({
      where: { conversationId, userId: { not: senderId } },
      select: { userId: true },
    });
    await Promise.all(
      others.map((o) =>
        createNotification(o.userId, 'MESSAGE', 'Nova mensagem', preview, { conversationId })
      )
    );

    return message;
  },

  /**
   * Cria ou busca uma conversa direta (1-para-1) entre dois usuários.
   * Se já existir, retorna a existente.
   */
  async getOrCreateDirectConversation(userId1: string, userId2: string) {
    // Buscar conversa existente entre os dois (não grupo)
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: userId2 } } },
        ],
      },
      select: { id: true },
    });

    if (existing) return existing;

    // Criar nova conversa
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId: userId1 },
            { userId: userId2 },
          ],
        },
      },
      select: { id: true },
    });

    return conversation;
  },

  /**
   * Marca o status de "digitando" de um usuário em uma conversa.
   */
  async setTyping(conversationId: string, userId: string, isTyping: boolean) {
    await prisma.conversationUser.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { isTyping },
    });
  },
};
