# AuPairConnect 🌎✈️

**AuPairConnect** é a rede social definitiva para Au Pairs, Mentoras e ex-Au Pairs. O aplicativo conecta meninas que estão planejando ou já vivendo a jornada de intercâmbio, permitindo que elas compartilhem experiências (feed), façam amizades (chat direto e radar de proximidade), e participem de salas de áudio ao vivo (Comunidade).

Nossa missão é criar um ambiente seguro, acolhedor e informativo. O sistema conta com recursos voltados para a segurança da usuária, como o botão SOS/Emergência, ofuscamento de localização exata no radar, e um módulo rigoroso de moderação e privacidade (adequado à LGPD/GDPR).

Atualmente o projeto está em fase de **Soft Launch** (MVP funcional), mas a infraestrutura foi desenhada para escalar horizontalmente e suportar milhares de usuárias simultâneas nos próximos meses.

---

## 🛠️ Stack de Tecnologia

O projeto é um monorepo prático dividido em Frontend (React) e Backend (Node.js).

### Frontend
- **Framework:** React 18 + Vite
- **Estilização:** Tailwind CSS + Lucide Icons
- **Gerenciamento de Estado:** Zustand (Global) + React Context
- **Roteamento:** React Router DOM (Lazy Loading)
- **Hospedagem:** Vercel

### Backend
- **Core:** Node.js (v20+) + TypeScript
- **Framework Web:** Express (REST API v1)
- **Banco de Dados Relacional:** PostgreSQL (Hospedado no Supabase)
- **ORM:** Prisma
- **Tempo Real (Chat/Sockets):** Socket.IO com Redis Adapter (Upstash)
- **Tempo Real (Áudio):** LiveKit (WebRTC)
- **Armazenamento de Mídia:** Cloudinary (Imagens otimizadas com IA)
- **Hospedagem:** Render

---

## 📋 Pré-requisitos

Antes de clonar o repositório, certifique-se de ter instalado em sua máquina:
- **Node.js** (v20 ou superior)
- **npm** (v10 ou superior)
- **Git**
- *Opcional:* Docker e Docker Compose (caso prefira rodar o banco PostgreSQL e o Redis localmente via containers).

---

## 🚀 Como rodar localmente (Passo a Passo)

Siga os passos abaixo para ter o ambiente rodando na sua máquina em menos de 10 minutos.

### 1. Clone o repositório
```bash
git clone https://github.com/CarlosAlbertoFurtado/al-pair.git
cd al-pair
```

### 2. Configurando o Backend (API)
Abra uma aba no terminal e execute:
```bash
cd server
npm install
```

Crie o arquivo de variáveis de ambiente:
```bash
cp .env.example .env
```
*(Abra o `.env` gerado e preencha a `DATABASE_URL` com seu banco PostgreSQL local ou do Supabase de testes).*

Inicie o banco de dados e as tabelas:
```bash
npm run db:generate
npm run db:push
```

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
> O backend estará rodando em `http://localhost:3001`

### 3. Configurando o Frontend (App)
Abra **outra** aba no terminal, na raiz do projeto, e execute:
```bash
npm install
npm run dev
```
> O frontend estará rodando em `http://localhost:5173` e já estará conectado ao backend local.

---

## 🧪 Como rodar testes

A suíte de testes garante a estabilidade do sistema antes de cada deploy.

**Testes do Backend:**
```bash
cd server
npm test
```
*(Para garantir que a cobertura está adequada após suas mudanças, rode `npm run test:coverage`)*

**Testes do Frontend:**
```bash
# Na raiz do projeto
npm test
```

---

## 🏗️ Como fazer build

Para compilar o projeto simulando o ambiente de produção:

**Backend:**
```bash
cd server
npm run build
# O código transpilado irá para a pasta server/dist
```

**Frontend:**
```bash
# Na raiz
npm run build
# O bundle otimizado irá para a pasta dist/
```

---

## 🚢 Como fazer deploy

O projeto possui integração contínua contínua (CI/CD) automatizada.

- **Frontend (Vercel):** Qualquer push ou merge na branch `main` dispara o build automático na Vercel. A Vercel lê o comando `npm run build` na raiz do repositório.
- **Backend (Render):** O Render escuta a branch `main`. O blueprint de deploy está no arquivo `render.yaml`. Ele entra na pasta `server`, instala dependências, roda as migrations (`npm run db:push` ou `deploy`) e inicia o servidor com `npm start`.

Se você precisar fazer um rollback de emergência, basta reverter o commit na `main` (`git revert`) ou acessar o painel da Vercel/Render e clicar em "Redeploy" num build anterior.

---

## 🔐 Variáveis de Ambiente Necessárias

### Backend (`server/.env`)
- `DATABASE_URL`: String de conexão do PostgreSQL (Ex: Supabase).
- `PORT`: Porta do servidor (Padrão: 3001).
- `JWT_ACCESS_SECRET`: Chave criptográfica para assinar tokens de sessão curta.
- `JWT_REFRESH_SECRET`: Chave criptográfica para assinar tokens de renovação longa.
- `CORS_ORIGIN`: URL do frontend autorizada a fazer requisições (Ex: `https://seusite.vercel.app`).
- `REDIS_URL`: URL do Upstash Redis (Necessário para escalar Socket.IO para múltiplos nós).
- `CLOUDINARY_URL`: URL de conexão do Cloudinary (Salvar fotos).
- `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_WS_URL`: Chaves do servidor de áudio LiveKit.
- `RESEND_API_KEY`: Chave da API de envio de e-mails transacionais.
- `EMAIL_FROM`: Remetente validado no Resend (Ex: `suporte@aupairconnect.com`).
- `FRONTEND_URL`: URL pública do frontend para links de recuperação de senha.

### Frontend (`.env`)
- `VITE_API_URL`: URL pública do backend (Ex: `https://api.aupairconnect.com/api/v1`).
- `VITE_WS_URL`: URL pública do WebSocket (Ex: `https://api.aupairconnect.com`).
- `VITE_LIVEKIT_URL`: URL pública do servidor LiveKit para o cliente conectar.

---

## 📁 Estrutura de Pastas (Árvore Comentada)

```text
/
├── public/                 # Assets estáticos públicos do React
├── src/                    # Código fonte do Frontend
│   ├── api.js              # Interceptors do Axios e configuração WebSocket
│   ├── components/         # Componentes React reutilizáveis (Botões, Modais, Layouts)
│   ├── features/           # Componentes agrupados por domínio (Auth, Feed, Profile, Chat)
│   ├── store/              # Estado global do Zustand (useAuthStore, etc)
│   ├── utils/              # Funções de validação e helpers
│   └── App.jsx             # Roteador principal e Lazy Loading
├── server/                 # Código fonte do Backend
│   ├── prisma/             # Schema do banco de dados e Migrations
│   ├── src/
│   │   ├── config/         # Conexões (DB, Cloudinary, Env)
│   │   ├── middleware/     # Middlewares Express (Auth, ErrorHandler)
│   │   ├── modules/        # Arquitetura modularizada (Domain Driven)
│   │   │   ├── auth/       # Serviços, Controllers e Rotas de autenticação
│   │   │   ├── chat/       # Mensageria direta
│   │   │   ├── posts/      # Feed e interações sociais
│   │   │   └── rooms/      # Salas de áudio e LiveKit
│   │   └── server.ts       # Entry point e inicialização do Express
├── docs/                   # Toda a documentação de arquitetura e onboarding
├── render.yaml             # IaC (Infrastructure as Code) do Render
└── package.json            # Scripts globais do repositório
```

---

## 📚 Links para Docs Adicionais

Se você acabou de chegar na equipe, sugerimos que leia os documentos abaixo em ordem:

1. [CONTRIBUTING.md](./docs/onboarding/CONTRIBUTING.md) - Regras de PR, commits e code review.
2. [ARCHITECTURE.md](./docs/onboarding/ARCHITECTURE.md) - Desenho da arquitetura, fluxo de dados e ADRs.
3. [ONBOARDING.md](./docs/onboarding/ONBOARDING.md) - Seu guia passo a passo da primeira semana de trabalho.
4. [CODE_STYLE.md](./docs/onboarding/CODE_STYLE.md) - Nossos padrões de código limpo.
5. [RUNBOOKS.md](./docs/onboarding/RUNBOOKS.md) - O que fazer quando o servidor pegar fogo em produção.
