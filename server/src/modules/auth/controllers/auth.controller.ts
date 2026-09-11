// ══════════════════════════════════════════════════════════════
// Auth Controller - Camada HTTP
// Recebe as requisições, extrai dados, chama o Service e
// retorna respostas HTTP padronizadas.
// ══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import type { AuthRequest } from '../../../middleware/authenticate.js';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso!',
      data: result,
    });
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: result,
    });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);

    res.status(200).json({
      success: true,
      data: { tokens },
    });
  },

  async logout(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { refreshToken } = req.body;

    await authService.logout(userId, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso.',
    });
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const result = await authService.requestPasswordReset(req.body.email);
    res.status(200).json({ success: true, message: result.message, data: { resetToken: result.resetToken, emailSent: result.emailSent } });
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json({ success: true, message: 'Senha redefinida com sucesso.' });
  },

  async me(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.userId!;

    // Import dinâmico para evitar dependência circular
    const { prisma } = await import('../../../config/database.js');
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        coverUrl: true,
        role: true,
        city: true,
        country: true,
        xp: true,
        level: true,
        isMentorActive: true,
        specialties: true,
        totalEarnings: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { user },
    });
  },
};
