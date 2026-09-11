import { z } from 'zod';
import { mediaUrlSchema } from './media.validator.js';

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(300).optional().nullable(),
  avatarUrl: mediaUrlSchema.optional().nullable(),
  coverUrl: mediaUrlSchema.optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  specialties: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
  hourlyRate: z.number().min(0).max(1000).optional(),
});
