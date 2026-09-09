// ══════════════════════════════════════════════════════════════
// Auth Routes - Mapeamento de endpoints HTTP
// ══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../../../middleware/authenticate.js';
import { validate } from '../../../middleware/validate.js';
import { z } from 'zod';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema 
} from '../../../shared/validators/auth.validator.js';

const forgotPasswordSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: registerSchema.shape.password,
});

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

// POST /api/auth/logout (requer autenticação)
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me (retorna perfil do usuário logado)
router.get('/me', authenticate, authController.me);

router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;
