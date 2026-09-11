// ══════════════════════════════════════════════════════════════
// Variáveis de ambiente centralizadas e tipadas
// Todas as configs do sistema passam por aqui. Nenhum outro
// arquivo deve usar process.env diretamente.
// ══════════════════════════════════════════════════════════════

import dotenv from 'dotenv';

dotenv.config();

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`[CONFIG] Variável de ambiente obrigatória ausente: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const env = {
  // Servidor
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: parseInt(getEnv('PORT', '3001'), 10),
  
  // Banco de Dados
  DATABASE_URL: getEnv('DATABASE_URL'),
  
  // JWT
  JWT_ACCESS_SECRET: getEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRY: getEnv('JWT_ACCESS_EXPIRY', '15m'),
  JWT_REFRESH_EXPIRY: getEnv('JWT_REFRESH_EXPIRY', '7d'),
  
  // CORS
  CORS_ORIGIN: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
  FRONTEND_URL: getEnv('FRONTEND_URL', getEnv('CORS_ORIGIN', 'http://localhost:5173')),
  
  // Uploads
  CLOUDINARY_URL: getOptionalEnv('CLOUDINARY_URL'),
  UPLOAD_DIR: getEnv('UPLOAD_DIR', './uploads'),
  MAX_FILE_SIZE_MB: parseInt(getEnv('MAX_FILE_SIZE_MB', '10'), 10),

  // E-mail transacional
  RESEND_API_KEY: getOptionalEnv('RESEND_API_KEY'),
  EMAIL_FROM: getOptionalEnv('EMAIL_FROM', 'AuPairConnect <noreply@aupairconnect.app>'),
  
  // Helpers
  isDev: getEnv('NODE_ENV', 'development') === 'development',
  isProd: getEnv('NODE_ENV', 'development') === 'production',
} as const;
