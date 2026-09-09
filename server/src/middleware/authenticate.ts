// ══════════════════════════════════════════════════════════════
// Middleware de Autenticação JWT
// Verifica o token de acesso em toda rota protegida.
// Anexa o userId ao objeto Request para uso nos controllers.
// ══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../shared/errors/AppError.js';

// Extensão do tipo Request para incluir dados do usuário autenticado
export interface AuthRequest extends Request {
  userId?: string;
}

interface JwtPayload {
  sub: string;  // userId
  iat: number;
  exp: number;
}

export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de acesso não fornecido.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.userId = decoded.sub;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expirado. Faça login novamente.');
    }
    throw new UnauthorizedError('Token inválido.');
  }
}

// Middleware opcional: Permite acesso mesmo sem token (rotas públicas com dados extras se logado)
export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      req.userId = decoded.sub;
    } catch {
      // Token inválido - ignora silenciosamente (rota é pública)
    }
  }

  next();
}
