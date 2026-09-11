# Beta hardening - 2026-09-11

Commit de referencia: `93d905c Harden beta launch surface`

## Objetivo

Preparar o AuPairConnect para uma beta mais defensavel, reduzindo risco de produto, seguranca e deploy antes de adicionar novas features.

O foco desta rodada foi:

- Remover promessas de features incompletas do caminho principal.
- Bloquear acesso ao Cofre Digital na beta.
- Transformar Salas de Audio em "em breve".
- Corrigir build/deploy do backend.
- Fazer testes minimos de frontend e backend rodarem.
- Adicionar moderacao social minima: denunciar e bloquear.
- Aplicar bloqueios nas queries criticas do backend.

## Resumo executivo

O app saiu de um estado de MVP parcial com areas perigosas expostas para uma base mais controlada para beta fechada.

Antes:

- Cofre Digital aparecia para usuario, mesmo sem politica forte para documentos sensiveis.
- Salas prometiam audio ao vivo, mas nao havia audio real.
- Backend no Render podia iniciar sem `dist/server.js`, porque o build nao era executado.
- Testes estavam configurados, mas quebravam ou dependiam de ferramenta ausente.
- Denuncia/bloqueio existiam parcialmente no backend, mas sem UX e sem efeito real nas principais queries.

Depois:

- Cofre Digital esta fora do fluxo de beta.
- `/vault` redireciona para `/profile`.
- Salas mostram uma tela honesta de "Em breve".
- Render tem build command correto.
- Frontend e backend possuem smoke tests executaveis.
- Usuario pode denunciar post, denunciar perfil e bloquear usuario.
- Bloqueios passam a afetar feed, busca, perfil, usuarios proximos e chat.

## Mudancas de produto

### Salas de Audio

Arquivo principal:

- `src/features/rooms/AudioRooms.jsx`

O que mudou:

- A tela deixou de chamar `roomsAPI.list()`.
- A tela deixou de exibir salas como se fossem audio real.
- Removidas acoes de criar/entrar em sala.
- Adicionado estado "Em breve" explicando que voz real depende de moderacao, denuncia, bloqueio e regras de uso.

Motivo:

Audio ao vivo aumenta complexidade de infraestrutura, moderacao, abuso e custo. Para beta, o caminho principal deve ser comunidade social: perfil, feed, busca, follow e chat.

### Menu de criacao

Arquivo:

- `src/components/layout/MainLayout.jsx`

O que mudou:

- Removido import e uso de `CreateRoomModal`.
- Removida opcao "Sala de Audio" do menu de criacao.
- Menu de criacao agora oferece apenas "Publicacao".

Motivo:

Evitar que usuario tente criar uma feature que ainda nao entrega audio real.

### Cofre Digital

Arquivos:

- `src/features/profile/Profile.jsx`
- `src/App.jsx`

O que mudou:

- Removido "Cofre Digital" do menu do perfil.
- Rota `/vault` agora redireciona para `/profile`.
- A tela `VaultScreen` e APIs de vault continuam no codigo, mas fora do acesso do usuario na beta.

Motivo:

Cofre Digital envolve dados sensiveis e possivelmente documentos pessoais. Antes de expor essa feature, o projeto precisa de politica LGPD, storage seguro, auditoria, controles de acesso revisados e decisao clara de retencao/exclusao.

## Moderacao social

### API frontend

Arquivo:

- `src/api.js`

Adicionado:

```js
export const moderationAPI = {
  report: (data) => api.post('/moderation/report', data),
  block: (userId) => api.post(`/moderation/block/${userId}`),
  unblock: (userId) => api.delete(`/moderation/block/${userId}`),
};
```

### Denuncia de post

Arquivo:

- `src/features/feed/HomeFeed.jsx`

O que mudou:

- Adicionado botao de denunciar publicacao com icone `Flag`.
- A denuncia chama `moderationAPI.report`.
- Fluxo atual usa `window.confirm` e `alert` como UX minima.

Contrato usado:

```js
{
  targetType: 'POST',
  targetId: post.id,
  reason: 'Conteúdo impróprio'
}
```

### Denuncia e bloqueio de usuario

Arquivo:

- `src/features/profile/UserProfileScreen.jsx`

O que mudou:

- Adicionados botoes "Denunciar" e "Bloquear" em perfis de outros usuarios.
- Denuncia de perfil chama `moderationAPI.report`.
- Bloqueio chama `moderationAPI.block`.
- Apos bloquear, o app navega de volta para o feed.

Contrato de denuncia:

```js
{
  targetType: 'USER',
  targetId: profile.id,
  reason: 'Comportamento impróprio'
}
```

## Backend de moderacao

### Helper central de bloqueio

Arquivo:

- `server/src/modules/moderation/moderation.service.ts`

Adicionado:

- `visibleUserWhere(viewerId)`
- `visiblePostWhere(viewerId)`
- `hasBlockBetween(userIdA, userIdB)`

Regra adotada:

Se A bloqueia B, entao A e B deixam de aparecer um para o outro nas areas criticas.

### Rotas de moderacao

Arquivo:

- `server/src/modules/moderation/moderation.routes.ts`

O que mudou:

- Denuncia agora valida se o alvo existe para `USER`, `POST` ou `MESSAGE`.
- Bloqueio valida se o usuario alvo existe.
- Bloquear a si mesmo continua proibido.
- Ao bloquear, follows entre as duas pessoas sao removidos em transacao.

Rotas envolvidas:

- `POST /api/moderation/report`
- `POST /api/moderation/block/:userId`
- `DELETE /api/moderation/block/:userId`

## Aplicacao dos bloqueios

### Feed

Arquivo:

- `server/src/modules/posts/services/posts.service.ts`

O que mudou:

- `getFeed` agora aplica `visiblePostWhere(userId)`.
- Posts de usuarios bloqueados ou que bloquearam o viewer deixam de aparecer.
- Comentario em post de usuario bloqueado fica proibido.

### Busca

Arquivo:

- `server/src/modules/search/search.routes.ts`

O que mudou:

- Busca de usuarios aplica `visibleUserWhere(req.userId)`.
- Busca de posts aplica `visiblePostWhere(req.userId)`.

### Perfil publico

Arquivo:

- `server/src/modules/users/services/users.service.ts`

O que mudou:

- `getProfile` retorna 404 quando ha bloqueio entre viewer e perfil alvo.
- `toggleFollow` rejeita follow quando ha bloqueio entre as pessoas.

### Usuarios proximos

Arquivos:

- `server/src/modules/users/services/users.service.ts`
- `server/src/modules/users/controllers/users.controller.ts`

O que mudou:

- `getNearbyUsers` passou a receber `viewerId`.
- Resultado de usuarios proximos tambem aplica `visibleUserWhere(viewerId)`.

### Chat

Arquivo:

- `server/src/modules/chat/services/chat.service.ts`

O que mudou:

- Conversas com participantes bloqueados deixam de aparecer em `getConversations`.
- `getMessages` rejeita leitura de conversa se houver bloqueio entre participantes.
- `sendMessage` rejeita envio se houver bloqueio entre remetente e destinatario.
- `getOrCreateDirectConversation` rejeita criacao/retorno de conversa direta se houver bloqueio.

## Build, deploy e testes

### Render

Arquivos:

- `render.yaml`
- `server/render.yaml`

O que mudou:

- Criado `render.yaml` na raiz com `rootDir: server`.
- Corrigido build command para:

```bash
npm ci && npm run db:generate && npm run build
```

- Start command permanece:

```bash
npm start
```

- Health check configurado em:

```txt
/api/health
```

Motivo:

O backend usa `node dist/server.js`; portanto o deploy precisa gerar `dist` antes do start.

### Backend boot seguro para testes

Arquivo:

- `server/src/server.ts`

O que mudou:

- `bootstrap()` agora roda apenas quando `server.ts` e executado diretamente.
- Importar `app` em teste nao sobe servidor, nao conecta banco e nao abre porta.

Motivo:

Permitir smoke tests HTTP usando o app Express sem efeitos colaterais pesados.

### Testes frontend

Arquivos:

- `jest.config.js`
- `babel.config.js`
- `jest.setup.cjs`
- `src/__tests__/smoke.test.js`

O que mudou:

- Configs migrados de CommonJS para ESM.
- Setup do Jest movido para `.cjs`.
- Testes do frontend ignoram `/server/`.
- Ambiente alterado para `node` no smoke atual.
- Adicionado smoke test simples para validar que o runner executa.

### Testes backend

Arquivos:

- `server/package.json`
- `server/src/server.test.ts`
- `server/tsconfig.json`

O que mudou:

- Script `test` deixou de depender de `vitest` ausente.
- Novo comando:

```bash
node --import tsx --test "src/**/*.test.ts"
```

- `server/src/server.test.ts` valida contrato 404 da API.
- `tsconfig.json` exclui `**/*.test.ts` do build de producao.

## Documentacao

Arquivo:

- `README.md`

O que mudou:

- Substituido README de template Vite por README real do AuPairConnect.
- Incluido status de beta.
- Listadas features dentro e fora da beta.
- Documentados comandos para rodar frontend/backend.
- Documentadas variaveis de ambiente principais.
- Documentados comandos de teste/build.
- Incluido checklist antes da beta.

## Validacao executada

Frontend:

```bash
npm test -- --runInBand
npm run build
```

Backend:

```bash
cd server
npm test
npm run build
```

Resultado:

- Teste frontend passou.
- Build frontend passou.
- Teste backend passou.
- Build backend passou.

Observacao:

- O build frontend ainda emite aviso de chunk acima de 500 kB. Nao bloqueia beta, mas deve entrar em melhoria posterior de code splitting.

## Arquivos alterados

- `README.md`
- `babel.config.js`
- `jest.config.js`
- `jest.setup.cjs`
- `jest.setup.js`
- `render.yaml`
- `server/package.json`
- `server/render.yaml`
- `server/src/modules/chat/services/chat.service.ts`
- `server/src/modules/moderation/moderation.routes.ts`
- `server/src/modules/moderation/moderation.service.ts`
- `server/src/modules/posts/services/posts.service.ts`
- `server/src/modules/search/search.routes.ts`
- `server/src/modules/users/controllers/users.controller.ts`
- `server/src/modules/users/services/users.service.ts`
- `server/src/server.test.ts`
- `server/src/server.ts`
- `server/tsconfig.json`
- `src/App.jsx`
- `src/__tests__/smoke.test.js`
- `src/api.js`
- `src/components/layout/MainLayout.jsx`
- `src/features/feed/HomeFeed.jsx`
- `src/features/profile/Profile.jsx`
- `src/features/profile/UserProfileScreen.jsx`
- `src/features/rooms/AudioRooms.jsx`

## Riscos ainda abertos

- Denuncia ainda nao tem painel operacional para moderador.
- UX de denuncia/bloqueio usa `confirm` e `alert`; deve virar modal/toast.
- Bloqueio em chat foi aplicado em servico, mas ainda falta cobertura de testes especifica.
- Cofre Digital continua existindo no backend e no codigo da tela, apenas bloqueado no frontend.
- Reset de senha ainda precisa e-mail real antes de beta publica.
- Backups/PITR do Supabase precisam ser confirmados no painel.
- Termos de uso, politica de privacidade e regras de comunidade ainda precisam ser escritos.
- Chunk principal do frontend esta acima de 500 kB.

## Proximos passos recomendados

1. Criar modal real de denuncia com motivo e descricao opcional.
2. Criar toast/helper padrao para sucesso e erro.
3. Adicionar testes de integracao para bloqueio: feed, busca, perfil e chat.
4. Criar tela/painel minimo de moderacao para listar reports abertos.
5. Implementar edicao basica de perfil.
6. Confirmar deploy Render + Vercel com envs reais.
7. Validar Supabase backups/PITR e politica de retencao.
