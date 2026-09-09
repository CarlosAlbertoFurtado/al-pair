// ══════════════════════════════════════════════════════════════
// Conexão resiliente com PostgreSQL
// Aguarda o banco subir (Docker) antes de aceitar requisições.
// ══════════════════════════════════════════════════════════════

import { prisma } from './database.js';
import { env } from './env.js';

const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 1000;

function maskDatabaseUrl(url: string): string {
  return url.replace(/:([^:@/]+)@/, ':****@');
}

export async function connectDatabase(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ PostgreSQL conectado com sucesso.');
      return;
    } catch {
      console.warn(`⏳ PostgreSQL indisponível (tentativa ${attempt}/${MAX_RETRIES})...`);

      if (attempt === MAX_RETRIES) {
        console.error('');
        console.error('❌ Não foi possível conectar ao PostgreSQL.');
        console.error('   1. Abra o Docker Desktop e aguarde iniciar');
        console.error('   2. Na pasta server, execute: docker compose up -d');
        console.error(`   3. Verifique DATABASE_URL: ${maskDatabaseUrl(env.DATABASE_URL)}`);
        console.error('');
        throw new Error('PostgreSQL não está acessível.');
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
