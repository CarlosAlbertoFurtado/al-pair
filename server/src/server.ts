// ══════════════════════════════════════════════════════════════
// AuPairConnect - Servidor Principal
// Ponto de entrada da aplicação. Configura Express, Middleware
// de segurança, rotas e WebSocket.
// ══════════════════════════════════════════════════════════════

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { connectDatabase, checkDatabaseHealth } from './config/ensureDatabase.js';
import { errorHandler } from './middleware/errorHandler.js';
import client from 'prom-client';
// Collect default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics();
import { initializeChatGateway } from './modules/chat/gateway/chat.gateway.js';

// ─── Importar Rotas ────────────────────────────────────────

import { fileURLToPath } from 'url';
import path from 'path';
import authRoutes from './modules/auth/routes/auth.routes.js';
import usersRoutes from './modules/users/routes/users.routes.js';
import postsRoutes from './modules/posts/routes/posts.routes.js';
import chatRoutes from './modules/chat/routes/chat.routes.js';
import agenciesRoutes from './modules/agencies/routes/agencies.routes.js';
import vaultRoutes from './modules/vault/routes/vault.routes.js';
import roomsRoutes from './modules/rooms/routes/rooms.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import journeyRoutes from './modules/journey/journey.routes.js';
import emergencyRoutes from './modules/emergency/emergency.routes.js';
import badgesRoutes from './modules/badges/badges.routes.js';
import moderationRoutes from './modules/moderation/moderation.routes.js';

// ─── Inicialização ─────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

// Servir arquivos de upload como estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname_root = path.resolve(path.dirname(__filename), '../..');
app.use('/uploads', express.static(path.join(__dirname_root, 'uploads')));

// ─── Middleware de Segurança (ordem importa!) ──────────────

// Helmet: Protege contra XSS, clickjacking, etc.
app.use(helmet());

// CORS: Permite apenas o frontend acessar a API
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compressão Gzip: Reduz tamanho das respostas (app leve no celular)
app.use(compression());

// Parser de JSON com limite (proteção contra payloads gigantes)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate Limiter Global: Proteção contra DDoS e brute force
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // Máx 200 requisições por IP por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas requisições deste endereço. Aguarde 15 minutos.',
  },
});
app.use('/api', globalLimiter);

// Rate limiter específico para autenticação (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Máx 10 tentativas de login/registro por 15 min
  message: {
    success: false,
    message: 'Muitas tentativas de login. Aguarde 15 minutos.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Rotas da API ──────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/agencies', agenciesRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/moderation', moderationRoutes);

// Health Check
app.get('/api/health', async (_req, res) => {
  const dbOk = await checkDatabaseHealth();

  res.status(dbOk ? 200 : 503).json({
    success: dbOk,
    message: dbOk ? 'AuPairConnect API operacional.' : 'API online, mas PostgreSQL indisponível.',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    services: {
      database: dbOk ? 'connected' : 'disconnected',
    },
  });
});

// Metrics endpoint for Prometheus
app.get('/api/metrics', async (_req, res) => {
  try {
    const metrics = await client.register.metrics();
    res.set('Content-Type', client.register.contentType);
    res.end(metrics);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to collect metrics' });
  }
});
// ─── Rota 404 (deve vir DEPOIS de todas as rotas) ──────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado.',
  });
});

// ─── Error Handler Global (SEMPRE o último middleware) ─────

app.use(errorHandler);

// ─── Iniciar Servidor ──────────────────────────────────────

async function bootstrap() {
  await connectDatabase();
  await initializeChatGateway(httpServer);

  httpServer.listen(env.PORT, '0.0.0.0', () => {
    console.log('');
    console.log('══════════════════════════════════════════════');
    console.log(`  🚀 AuPairConnect API v1.0.0`);
    console.log(`  📡 Servidor rodando na porta ${env.PORT}`);
    console.log(`  🔗 http://localhost:${env.PORT}/api/health`);
    console.log(`  🌐 CORS permitido para: ${env.CORS_ORIGIN}`);
    console.log(`  ⚡ WebSocket (Chat) ativo`);
    console.log(`  🔧 Ambiente: ${env.NODE_ENV}`);
    console.log('══════════════════════════════════════════════');
    console.log('');
  });
}

const isDirectRun = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isDirectRun) {
  bootstrap().catch((error) => {
    console.error('[FATAL]', error.message);
    process.exit(1);
  });
}

export default app;
