// ══════════════════════════════════════════════════════════════
// Middleware de Validação genérico com Zod
// Aplica qualquer schema Zod a body, query ou params de um
// request, garantindo tipagem e mensagens claras de erro.
// ══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../shared/errors/AppError.js';

type RequestField = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, field: RequestField = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[field]);
      // Sobrescreve o campo com os dados já tratados/transformados pelo Zod
      (req as any)[field] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.') || '_root';
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(issue.message);
        }
        throw new ValidationError(formattedErrors);
      }
      throw error;
    }
  };
}
