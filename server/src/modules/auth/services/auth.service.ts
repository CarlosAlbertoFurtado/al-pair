// ══════════════════════════════════════════════════════════════
// Auth Service - Regras de Negócio de Autenticação
// Camada pura de lógica: não sabe que HTTP existe.
// ══════════════════════════════════════════════════════════════

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '../../../config/database.js';
import { env } from '../../../config/env.js';
import { 
  UnauthorizedError, 
  ConflictError
} from '../../../shared/errors/AppError.js';
type UserRole = string;

// ─── Tipos ─────────────────────────────────────────────────

interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: UserRole;
    isMentorActive: boolean;
  };
  tokens: TokenPair;
}

async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    if (env.isDev) {
      console.log(`[AUTH] Link de recuperação: ${resetUrl}`);
    } else {
      console.warn('[AUTH] RESEND_API_KEY ausente; e-mail de recuperação não enviado.');
    }
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to,
        subject: 'Redefina sua senha no AuPairConnect',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
            <h1 style="font-size: 20px;">Redefinição de senha</h1>
            <p>Recebemos uma solicitação para redefinir sua senha no AuPairConnect.</p>
            <p><a href="${resetUrl}" style="color: #e11d48; font-weight: bold;">Criar nova senha</a></p>
            <p>Este link expira em 1 hora. Se você não pediu isso, ignore este e-mail.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[AUTH] Falha ao enviar e-mail de recuperação.', { status: response.status, body });
      return false;
    }
  } catch (error) {
    console.error('[AUTH] Erro ao chamar provedor de e-mail.', error);
    return false;
  }

  return true;
}

// ─── Funções Auxiliares de Token ────────────────────────────

function generateAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'] }
  );
}

function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, jti: randomBytes(16).toString('hex') },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'] }
  );
}

// ─── Service ───────────────────────────────────────────────

export const authService = {
  /**
   * Registra um novo usuário no sistema.
   * - Verifica duplicidade de e-mail
   * - Faz hash da senha com bcrypt (salt round 12)
   * - Gera par de tokens (access + refresh)
   * - Armazena o refresh token no banco para invalidação futura
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictError('Este e-mail já está cadastrado.');
    }

    // Hash da senha - salt round 12 (boa segurança sem impactar performance)
    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        passwordHash,
        displayName: input.displayName.trim(),
        role: input.role,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        isMentorActive: true,
      },
    });

    // Gerar tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Armazenar refresh token no banco (permite invalidação)
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7); // 7 dias

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshExpiry,
      },
    });

    return { user, tokens: { accessToken, refreshToken } };
  },

  /**
   * Autentica um usuário existente.
   * - Busca por e-mail
   * - Compara senha com bcrypt
   * - Gera novo par de tokens
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        isMentorActive: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('E-mail ou senha inválidos.');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('E-mail ou senha inválidos.');
    }

    // Gerar tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Armazenar refresh token
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshExpiry,
      },
    });

    // Atualizar status online
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeenAt: new Date() },
    });

    // Remover passwordHash da resposta
    const { passwordHash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens: { accessToken, refreshToken } };
  },

  /**
   * Renova o par de tokens usando o Refresh Token.
   * - Valida o refresh token no banco
   * - Invalida o token antigo (Rotation)
   * - Gera novo par de tokens
   */
  async refreshTokens(oldRefreshToken: string): Promise<TokenPair> {
    // Verificar assinatura do JWT
    let payload: { sub: string };
    try {
      payload = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
    } catch {
      throw new UnauthorizedError('Refresh token inválido ou expirado.');
    }

    // Verificar se o token existe no banco (não foi revogado)
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Se não existir, pode ser token reusado (ataque) - revogar TODOS do usuário
      await prisma.refreshToken.deleteMany({ where: { userId: payload.sub } });
      throw new UnauthorizedError('Sessão inválida. Faça login novamente.');
    }

    // Rotation: deletar o token usado (usamos deleteMany para não quebrar em requests concorrentes)
    await prisma.refreshToken.deleteMany({ where: { id: storedToken.id } });

    // Gerar novo par
    const accessToken = generateAccessToken(payload.sub);
    const refreshToken = generateRefreshToken(payload.sub);

    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.sub,
        expiresAt: refreshExpiry,
      },
    });

    return { accessToken, refreshToken };
  },

  /**
   * Faz logout do usuário.
   * - Invalida o refresh token específico
   * - Marca o usuário como offline
   */
  async requestPasswordReset(email: string): Promise<{ message: string; resetToken?: string; emailSent?: boolean }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      return { message: 'Se o e-mail existir, enviaremos instruções de recuperação.' };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: tokenHash, expiresAt },
    });

    const resetUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
    const emailSent = await sendPasswordResetEmail(user.email, resetUrl);

    return {
      message: 'Se o e-mail existir, enviaremos instruções de recuperação.',
      resetToken: env.isDev ? rawToken : undefined,
      emailSent: env.isDev ? emailSent : undefined,
    };
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const record = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash } });
    if (!record || record.expiresAt < new Date() || record.usedAt) {
      throw new UnauthorizedError('Token de recuperação inválido ou expirado.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
    ]);
  },

  async logout(userId: string, refreshToken: string): Promise<void> {
    // Revogar o refresh token
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken, userId },
    });

    // Marcar offline
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false, lastSeenAt: new Date() },
    });
  },
};
