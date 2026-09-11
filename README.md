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
- Cloudinary recomendado em producao para uploads e checagem de rosto em avatar

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
- `CLOUDINARY_URL` recomendado para fotos de perfil e imagens em posts
- `FRONTEND_URL` URL publica do frontend, usada nos links de recuperacao de senha
- `RESEND_API_KEY` para envio real de e-mail de recuperacao de senha
- `EMAIL_FROM` remetente validado no provedor de e-mail

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

Uploads:

- Posts aceitam JPEG, PNG e WEBP ate 8MB.
- Avatar aceita JPEG, PNG e WEBP ate 3MB.
- O frontend tenta detectar rosto no navegador antes do envio quando a API `FaceDetector` existe.
- Em producao, configure `CLOUDINARY_URL` no Render para armazenar imagens fora do disco efemero e permitir validacao de rosto no backend.
- A beta inclui links de termos, privacidade e regras da comunidade no fluxo de cadastro.
- Para recuperacao de senha funcionar em producao, configure `RESEND_API_KEY`, `EMAIL_FROM` e `FRONTEND_URL` no Render.

## Checklist antes de beta

- Confirmar backups/PITR no Supabase ou rotina de exportacao
- Confirmar `CORS_ORIGIN` com a URL final da Vercel
- Criar termos de uso e politica de privacidade
- Implementar denunciar/bloquear no frontend e aplicar bloqueios no backend
- Rodar teste manual com contas reais: cadastro, post, busca, follow, chat, denuncia e bloqueio
