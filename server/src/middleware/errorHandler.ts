// ══════════════════════════════════════════════════════════════
// Middleware de Tratamento Global de Erros
// Última barreira de defesa. Captura QUALQUER erro não tratado
// e retorna uma resposta JSON segura (sem expor stack traces).
// ══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../shared/errors/AppError.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log completo no servidor (para debug)
  console.error(`[ERROR] ${new Date().toISOString()}`, {
    name: err.name,
    message: err.message,
    stack: env.isDev ? err.stack : undefined,
  });

  // Se for um AppError (erro esperado e controlado)
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Erro desconhecido / Bug real - NUNCA expor detalhes para o cliente
  res.status(500).json({
    success: false,
    message: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
    ...(env.isDev && { debug: err.message }),
  });
}
