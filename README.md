# AuPairConnect

Aplicacao social para au pairs, mentoras e comunidade de apoio. O estado atual e beta/MVP: foco em autenticacao, perfil, feed, busca, follow, chat, jornada e recursos de emergencia.

## Status de beta

Incluido no caminho principal:

- Login, cadastro e refresh token
- Feed, publicacoes, likes e comentarios
- Perfil, busca, follow e chat direto
- Notificacoes basicas
- Jornada e SOS/emergencia

Fora da beta por enquanto:

- Cofre Digital com documentos reais
- Salas de audio ao vivo
- Pagamentos, assinatura e marketplace

## Estrutura

- `src/`: frontend React + Vite
- `server/src/`: backend Express + Prisma + Socket.IO
- `server/prisma/`: schema e seed do banco
- `render.yaml`: blueprint do backend no Render usando `rootDir: server`

## Requisitos

- Node.js 20+
- PostgreSQL
- Redis opcional para WebSocket em escala

## Rodando localmente

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd server
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

Variaveis principais do backend:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `PORT`
- `REDIS_URL` opcional

Variaveis principais do frontend:

- `VITE_API_URL` opcional
- `VITE_WS_URL` opcional

## Validacao

Frontend:

```bash
npm test
npm run build
```

Backend:

```bash
cd server
npm test
npm run build
```

## Deploy

Backend no Render:

- O blueprint raiz usa `rootDir: server`
- Build: `npm ci && npm run db:generate && npm run build`
- Start: `npm start`
- Health check: `/api/health`

Frontend no Vercel:

- Build: `npm run build`
- Output: `dist`
- Configure `VITE_API_URL` e `VITE_WS_URL` apontando para o backend publico.

## Checklist antes de beta

- Confirmar backups/PITR no Supabase ou rotina de exportacao
- Confirmar `CORS_ORIGIN` com a URL final da Vercel
- Criar termos de uso e politica de privacidade
- Implementar denunciar/bloquear no frontend e aplicar bloqueios no backend
- Rodar teste manual com contas reais: cadastro, post, busca, follow, chat, denuncia e bloqueio
