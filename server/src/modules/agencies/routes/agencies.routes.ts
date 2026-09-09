// ══════════════════════════════════════════════════════════════
// Agencies Routes
// ══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { agenciesController } from '../controllers/agencies.controller.js';
import { authenticate } from '../../../middleware/authenticate.js';

const router = Router();

// GET /api/agencies - Listar todas
router.get('/', agenciesController.list);

// GET /api/agencies/:id - Detalhes + Reviews
router.get('/:id', agenciesController.getDetail);

// POST /api/agencies/:id/reviews - Adicionar avaliação
router.post('/:id/reviews', authenticate, agenciesController.addReview);

export default router;
