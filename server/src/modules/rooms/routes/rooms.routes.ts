// ══════════════════════════════════════════════════════════════
// Rooms Routes
// ══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { roomsController } from '../controllers/rooms.controller.js';
import { authenticate } from '../../../middleware/authenticate.js';
import { validate } from '../../../middleware/validate.js';
import { createRoomSchema } from '../../../shared/validators/rooms.validator.js';

const router = Router();

// GET /api/rooms - Listar todas as salas ativas/agendadas
router.get('/', roomsController.listRooms);

// POST /api/rooms - Criar nova sala
router.post('/', authenticate, validate(createRoomSchema), roomsController.createRoom);

// POST /api/rooms/:id/join - Entrar na sala
router.post('/:id/join', authenticate, roomsController.joinRoom);

// POST /api/rooms/:id/leave - Sair da sala
router.post('/:id/leave', authenticate, roomsController.leaveRoom);

// POST /api/rooms/:id/start - Iniciar sala agendada (host)
router.post('/:id/start', authenticate, roomsController.startRoom);

// POST /api/rooms/:id/end - Encerrar sala (host)
router.post('/:id/end', authenticate, roomsController.endRoom);

// POST /api/rooms/:id/approve-speaker - Aprovar ouvinte para palestrante (host)
router.post('/:id/approve-speaker', authenticate, roomsController.approveSpeaker);

// GET /api/rooms/:id/token - Obter token LiveKit para entrar na sala de áudio
router.get('/:id/token', authenticate, roomsController.getRoomToken);

export default router;
