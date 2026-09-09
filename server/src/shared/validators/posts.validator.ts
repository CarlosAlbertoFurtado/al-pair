// ══════════════════════════════════════════════════════════════
// Posts Validators - Schemas Zod para criação de posts
// ══════════════════════════════════════════════════════════════

import { z } from 'zod';

export const createPostSchema = z.object({
  content: z
    .string({ required_error: 'Conteúdo é obrigatório.' })
    .min(1, 'Post não pode estar vazio.')
    .max(2000, 'Post muito longo (máx. 2000 caracteres).'),
  imageUrl: z.string().url().optional(),
  type: z.enum(['FEED', 'REMATCH']).default('FEED'),
  rematchUrgency: z.enum(['URGENT', 'TRANSFER']).optional(),
  rematchCity: z.string().max(100).optional(),
  rematchState: z.string().max(100).optional(),
  rematchCountry: z.string().max(100).optional(),
}).refine(
  (data) => {
    // Se tipo for REMATCH, urgência é obrigatória
    if (data.type === 'REMATCH' && !data.rematchUrgency) return false;
    return true;
  },
  { message: 'Para posts de Rematch, o nível de urgência é obrigatório.', path: ['rematchUrgency'] }
);

export const addCommentSchema = z.object({
  content: z
    .string({ required_error: 'Comentário é obrigatório.' })
    .min(1, 'Comentário não pode estar vazio.')
    .max(1000, 'Comentário muito longo (máx. 1000 caracteres).'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
