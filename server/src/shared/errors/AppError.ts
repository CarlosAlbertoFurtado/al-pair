// ══════════════════════════════════════════════════════════════
// Sistema de Erros customizados da aplicação
// Todos os erros conhecidos devem usar AppError.
// Isso permite que o middleware global os capture e retorne
// respostas HTTP padronizadas e seguras para o cliente.
// ══════════════════════════════════════════════════════════════

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 400, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // true = erro esperado, false = bug real
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ─── Erros Específicos (semânticos) ────────────────────────

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} não encontrado(a).`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Credenciais inválidas.') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Sem permissão para esta ação.') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Este recurso já existe.') {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;
  
  constructor(errors: Record<string, string[]>) {
    super('Dados de entrada inválidos.', 422);
    this.errors = errors;
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Muitas requisições. Tente novamente em alguns instantes.', 429);
  }
}
