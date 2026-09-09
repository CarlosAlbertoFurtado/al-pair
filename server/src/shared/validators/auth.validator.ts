// ══════════════════════════════════════════════════════════════
// Auth Validators - Schemas de validação Zod
// Garantem que nenhum dado sujo chegue ao Service.
// ══════════════════════════════════════════════════════════════

import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'E-mail é obrigatório.' })
    .email('Formato de e-mail inválido.')
    .max(255, 'E-mail muito longo.'),
  password: z
    .string({ required_error: 'Senha é obrigatória.' })
    .min(8, 'Senha deve ter no mínimo 8 caracteres.')
    .max(128, 'Senha muito longa.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter ao menos: 1 letra maiúscula, 1 minúscula e 1 número.'
    ),
  displayName: z
    .string({ required_error: 'Nome é obrigatório.' })
    .min(2, 'Nome deve ter no mínimo 2 caracteres.')
    .max(100, 'Nome muito longo.')
    .trim(),
  role: z.enum(['CANDIDATE', 'ALUMNI'], {
    errorMap: () => ({ message: 'Perfil deve ser CANDIDATE ou ALUMNI.' }),
  }),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'E-mail é obrigatório.' })
    .email('Formato de e-mail inválido.'),
  password: z
    .string({ required_error: 'Senha é obrigatória.' })
    .min(1, 'Senha é obrigatória.'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token é obrigatório.' })
    .min(1, 'Refresh token é obrigatório.'),
});

// Tipos inferidos dos schemas para uso nos controllers
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
