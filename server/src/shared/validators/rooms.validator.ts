import { z } from 'zod';

export const createRoomSchema = z.object({
  title: z.string().min(5, 'O título deve ter no mínimo 5 caracteres').max(100, 'O título deve ter no máximo 100 caracteres'),
  description: z.string().max(500).optional(),
  scheduledAt: z.string().datetime().optional().refine((val) => {
    if (!val) return true;
    return new Date(val).getTime() > Date.now();
  }, { message: 'A data agendada deve ser no futuro' }),
});
