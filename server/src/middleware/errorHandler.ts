// ══════════════════════════════════════════════════════════════
// Middleware de Tratamento Global de Erros
// Última barreira de defesa. Captura QUALQUER erro não tratado
// e retorna uma resposta JSON segura (sem expor stack traces).
// ══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
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

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Arquivo muito grande. Envie uma imagem menor.'
      : 'Não foi possível processar o arquivo enviado.';

    res.status(413).json({
      success: false,
      message,
    });
    return;
  }

  // Se for um AppError (erro esperado e controlado) - Duck typing evita problemas de instanceof
  if ('statusCode' in err && 'errors' in err) {
    const valErr = err as ValidationError;
    res.status(valErr.statusCode).json({
      success: false,
      message: valErr.message,
      errors: valErr.errors,
    });
    return;
  }

  if ('statusCode' in err) {
    const appErr = err as AppError;
    res.status(appErr.statusCode).json({
      success: false,
      message: appErr.message,
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
