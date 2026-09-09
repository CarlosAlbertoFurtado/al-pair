// ══════════════════════════════════════════════════════════════
// Instância Singleton do Prisma Client
// Garante que apenas UMA conexão com o banco exista em toda a
// aplicação, mesmo em hot-reload do desenvolvimento.
// ══════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDev ? ['query', 'warn', 'error'] : ['error'],
  });

if (env.isDev) {
  globalForPrisma.prisma = prisma;
}
