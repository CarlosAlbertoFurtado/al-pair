import { z } from 'zod';

const trustedRemoteMedia = [
  /^https:\/\/res\.cloudinary\.com\/.+/i,
  /^https:\/\/images\.unsplash\.com\/.+/i,
];

export function isAllowedMediaUrl(value: string) {
  return value.startsWith('/uploads/') || trustedRemoteMedia.some(pattern => pattern.test(value));
}

export const mediaUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine(isAllowedMediaUrl, 'URL de mídia não permitida.');
