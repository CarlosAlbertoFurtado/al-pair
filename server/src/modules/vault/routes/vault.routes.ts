// ══════════════════════════════════════════════════════════════
// Vault Routes
// ══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { vaultController } from '../controllers/vault.controller.js';
import { authenticate } from '../../../middleware/authenticate.js';
import { validate } from '../../../middleware/validate.js';
import { vaultItemSchema } from '../../../shared/validators/vault.validator.js';

const router = Router();

// GET /api/vault - Listar documentos do cofre
router.get('/', authenticate, vaultController.listItems);

// POST /api/vault - Adicionar documento ao cofre
router.post('/', authenticate, validate(vaultItemSchema), vaultController.addItem);

// DELETE /api/vault/:id - Remover documento do cofre
router.delete('/:id', authenticate, vaultController.deleteItem);

export default router;
