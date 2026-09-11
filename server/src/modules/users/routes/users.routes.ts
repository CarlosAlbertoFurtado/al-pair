// ══════════════════════════════════════════════════════════════
// Users Routes
// ══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authenticate, optionalAuth } from '../../../middleware/authenticate.js';
import { validate } from '../../../middleware/validate.js';
import { updateProfileSchema } from '../../../shared/validators/users.validator.js';

const router = Router();

// GET /api/users/nearby - Busca por geolocalização
router.get('/nearby', authenticate, usersController.getNearbyUsers);

// PATCH /api/users/profile - Atualizar próprio perfil
router.patch('/profile', authenticate, validate(updateProfileSchema), usersController.updateProfile);

// POST /api/users/mentor-toggle - Ativar/Desativar modo consultoria
router.post('/mentor-toggle', authenticate, usersController.toggleMentorMode);

// POST /api/users/location - Atualizar localização GPS
router.post('/location', authenticate, usersController.updateLocation);

// GET /api/users/:id - Perfil público de um usuário
router.get('/:id', optionalAuth, usersController.getProfile);

// POST /api/users/:id/follow - Seguir/Deixar de seguir
router.post('/:id/follow', authenticate, usersController.toggleFollow);

export default router;
