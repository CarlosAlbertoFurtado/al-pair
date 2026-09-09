// ══════════════════════════════════════════════════════════════
// Chat Routes
// ══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { authenticate } from '../../../middleware/authenticate.js';

const router = Router();

// GET /api/chat/conversations - Lista todas as conversas
router.get('/conversations', authenticate, chatController.getConversations);

// GET /api/chat/conversations/:conversationId/messages - Mensagens de uma conversa
router.get('/conversations/:conversationId/messages', authenticate, chatController.getMessages);

// POST /api/chat/direct/:userId - Criar ou buscar conversa direta com um usuário
router.post('/direct/:userId', authenticate, chatController.getOrCreateDirect);

export default router;
