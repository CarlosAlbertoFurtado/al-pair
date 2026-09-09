// ══════════════════════════════════════════════════════════════
// Chat Controller - Endpoints REST para histórico de chat
// (O envio em tempo real é feito via WebSocket, não REST)
// ══════════════════════════════════════════════════════════════

import { Response } from 'express';
import { chatService } from '../services/chat.service.js';
import type { AuthRequest } from '../../../middleware/authenticate.js';

export const chatController = {
  async getConversations(req: AuthRequest, res: Response): Promise<void> {
    const conversations = await chatService.getConversations(req.userId!);
    res.status(200).json({ success: true, data: { conversations } });
  },

  async getMessages(req: AuthRequest, res: Response): Promise<void> {
    const { cursor } = req.query;
    const result = await chatService.getMessages(
      (req.params.conversationId as string),
      req.userId!,
      cursor as string
    );
    res.status(200).json({ success: true, data: result });
  },

  async getOrCreateDirect(req: AuthRequest, res: Response): Promise<void> {
    const conversation = await chatService.getOrCreateDirectConversation(
      req.userId!,
      req.params.userId as string
    );
    res.status(200).json({ success: true, data: { conversation } });
  },
};
