// ══════════════════════════════════════════════════════════════
// Cloudinary configuration
// Mantém validação explícita para evitar uploads falsos em produção.
// ══════════════════════════════════════════════════════════════

import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

type CloudinaryStatus = {
  state: 'missing' | 'invalid' | 'configured';
  cloudName?: string;
  reason?: string;
};

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];

  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function readCloudinaryStatus(): CloudinaryStatus {
  const rawUrl = stripWrappingQuotes(env.CLOUDINARY_URL);

  if (!rawUrl) {
    return { state: 'missing', reason: 'CLOUDINARY_URL is empty.' };
  }

  try {
    const parsed = new URL(rawUrl);
    const apiKey = decodeURIComponent(parsed.username);
    const apiSecret = decodeURIComponent(parsed.password);
    const cloudName = parsed.hostname;

    if (parsed.protocol !== 'cloudinary:') {
      return { state: 'invalid', reason: 'CLOUDINARY_URL must start with cloudinary://.' };
    }

    if (!apiKey || !apiSecret || !cloudName) {
      return { state: 'invalid', reason: 'CLOUDINARY_URL must include api key, api secret, and cloud name.' };
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    return { state: 'configured', cloudName };
  } catch {
    return { state: 'invalid', reason: 'CLOUDINARY_URL is not a valid URL.' };
  }
}

export const cloudinaryStatus = readCloudinaryStatus();

export function isCloudinaryConfigured(): boolean {
  return cloudinaryStatus.state === 'configured';
}

export function getMediaStorageHealth() {
  if (cloudinaryStatus.state === 'configured') {
    return {
      status: 'cloudinary_configured',
      cloudName: cloudinaryStatus.cloudName,
    };
  }

  if (cloudinaryStatus.state === 'invalid') {
    return {
      status: 'invalid_cloudinary_url',
      reason: cloudinaryStatus.reason,
    };
  }

  return {
    status: env.isProd ? 'missing_cloudinary_url' : 'local_dev_fallback',
  };
}

export { cloudinary };
