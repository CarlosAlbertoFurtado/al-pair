# Beta hardening - 2026-09-11

Commits de referencia:

- `93d905c Harden beta launch surface`
- `2cdf1ad Improve moderation reporting flow`
- `53d4acb Add secure profile and post photo uploads`
- `5eb83ca Fix mobile image uploads`
- `16a58fe Fallback image upload when Cloudinary fails`

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
- Bloqueio em chat foi aplicado em servico, mas ainda falta cobertura de testes especifica.
- Cofre Digital continua existindo no backend e no codigo da tela, apenas bloqueado no frontend.
- Reset de senha ainda precisa e-mail real antes de beta publica.
- Backups/PITR do Supabase precisam ser confirmados no painel.
- Termos de uso, politica de privacidade e regras de comunidade ainda precisam ser escritos.
- Chunk principal do frontend esta acima de 500 kB.
- `CLOUDINARY_URL` precisa estar correto em producao. Storage local no Render e efemero e perde imagens apos restart/redeploy; por isso upload em producao agora falha se Cloudinary estiver ausente ou quebrado.
- O health check agora diferencia `cloudinary_configured`, `missing_cloudinary_url`, `invalid_cloudinary_url` e `local_dev_fallback`.

## Rodada complementar: denuncia, perfil e upload de fotos

Depois do hardening inicial, foram executadas mais tres frentes importantes para a beta: melhorar a experiencia de denuncia, permitir edicao de perfil e corrigir fotos em publicacoes.

### Denuncia com modal real

Commit:

- `2cdf1ad Improve moderation reporting flow`

Arquivos principais:

- `src/components/ReportModal.jsx`
- `src/features/feed/HomeFeed.jsx`
- `src/features/profile/UserProfileScreen.jsx`
- `server/src/modules/moderation/moderation.routes.ts`
- `server/src/modules/moderation/moderation.service.ts`

O que mudou:

- Criado modal de denuncia com motivo e descricao opcional.
- Denuncia de posts passou a usar o modal.
- Denuncia de usuarios no perfil publico passou a usar o modal.
- Feedback de sucesso/erro ficou na propria tela, sem depender de `alert`.
- Servico de moderacao foi separado das rotas.
- Testes cobrem payload de denuncia, validacao e filtros de bloqueio.

Motivo:

Para beta social, denuncia precisa parecer um fluxo real, nao um botao decorativo. Ainda falta painel de moderador, mas a coleta de denuncia ja esta mais consistente.

### Edicao de perfil e avatar

Commit:

- `53d4acb Add secure profile and post photo uploads`

Arquivos principais:

- `src/features/profile/Profile.jsx`
- `src/store/useAuthStore.js`
- `src/api.js`
- `src/utils/imageValidation.js`
- `server/src/modules/users/routes/users.routes.ts`
- `server/src/modules/users/services/users.service.ts`
- `server/src/shared/validators/users.validator.ts`

O que mudou:

- Tela de perfil agora permite editar nome, bio, cidade e pais.
- Usuario pode adicionar foto de perfil.
- Store de auth ganhou `updateUser` para refletir dados atualizados sem logout/login.
- Backend ganhou schema de atualizacao de perfil com validacao.
- Avatar aceita JPEG, PNG, WEBP, HEIC e HEIF.
- Avatar tem limite de 3MB.
- Frontend tenta detectar rosto com `FaceDetector` quando o navegador oferece suporte.
- Backend tenta checagem de rosto via Cloudinary quando `CLOUDINARY_URL` esta disponivel.

Limite conhecido:

A exigencia "apenas foto de pessoa" nao fica 100% garantida em todos os cenarios sem um provedor de visao/moderacao confiavel em producao. Hoje a protecao esta em camadas: tipo/tamanho de arquivo, normalizacao da imagem, tentativa de deteccao no navegador e Cloudinary quando configurado corretamente.

### Fotos em publicacoes

Commits:

- `53d4acb Add secure profile and post photo uploads`
- `5eb83ca Fix mobile image uploads`
- `16a58fe Fallback image upload when Cloudinary fails`

Arquivos principais:

- `src/features/create/CreatePostModal.jsx`
- `src/api.js`
- `server/src/modules/upload/upload.routes.ts`
- `server/src/modules/posts/services/posts.service.ts`
- `server/src/shared/validators/posts.validator.ts`
- `server/src/shared/validators/media.validator.ts`
- `server/src/shared/validators/posts.validator.test.ts`
- `server/src/shared/validators/media.validator.test.ts`

O que mudou:

- Criado endpoint dedicado `POST /api/upload/post-image`.
- Criado endpoint dedicado `POST /api/upload/avatar`.
- Endpoint legado `POST /api/upload` foi mantido para compatibilidade.
- Posts aceitam imagem com ou sem texto.
- Schema de post passou a rejeitar apenas posts totalmente vazios, sem texto e sem imagem.
- Imagens de post aceitam JPEG, PNG, WEBP, HEIC e HEIF.
- Limite de imagem de post: 8MB.
- Backend normaliza imagens com `sharp`, aplica rotacao por metadados e converte para JPG.
- URLs de midia agora passam por validador central.
- Validador aceita caminhos locais `/uploads/...` e URLs Cloudinary confiaveis.
- URLs remotas arbitrarias sao rejeitadas.

### Hotfix de upload mobile

Commit:

- `5eb83ca Fix mobile image uploads`

Problemas corrigidos:

- Fotos de celular podiam chegar como HEIC/HEIF e serem recusadas.
- O diretorio de upload local podia divergir entre execucao local e `dist` no Render.
- Erro de processamento de imagem podia cair como erro interno generico.

O que mudou:

- HEIC/HEIF foram adicionados aos tipos aceitos.
- Upload local passou a usar `path.resolve(process.cwd(), env.UPLOAD_DIR)`.
- Servidor estatico de `/uploads` passou a usar a mesma origem de caminho.
- Erros de imagem invalida passaram a ter mensagem controlada.

### Hotfix Cloudinary

Commit:

- `16a58fe Fallback image upload when Cloudinary fails`

Problema observado:

O app em producao retornava:

```txt
Nao foi possivel armazenar a imagem agora. Verifique o Cloudinary e tente novamente.
```

Diagnostico:

Isso indicava que `CLOUDINARY_URL` existia no ambiente do Render, mas o upload para Cloudinary estava falhando. Sem fallback, isso bloqueava foto de post e foto pelo perfil.

O que mudou inicialmente:

- Quando Cloudinary falha, o backend salva a imagem localmente como fallback.
- A resposta informa `storage: 'cloudinary'` ou `storage: 'local'`.
- Logs do backend registram a falha do Cloudinary para debug.

Decisao de produto:

Esse fallback destrava a beta, mas nao deve ser tratado como solucao final. Render tem filesystem efemero; imagens locais podem sumir apos restart/redeploy. Antes de beta com usuarios reais, o `CLOUDINARY_URL` deve ser corrigido ou trocado por Supabase Storage/R2/S3.

Correcao posterior:

- O fallback local foi removido para producao.
- Em producao, se `CLOUDINARY_URL` estiver ausente, o upload responde erro claro pedindo configuracao do Cloudinary.
- Em producao, se Cloudinary falhar, o upload nao salva localmente e responde erro claro para evitar fotos que somem depois.
- O fallback local continua permitido apenas em desenvolvimento local.

Correcao de diagnostico:

- A configuracao do Cloudinary deixou de depender apenas do carregamento automatico do SDK.
- Foi criada configuracao explicita em `server/src/config/cloudinary.ts`.
- `CLOUDINARY_URL` agora e validado no formato `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`.
- Se o valor estiver com formato invalido, `/api/health` mostra `invalid_cloudinary_url`.
- `/api/health/media` testa autenticação real no Cloudinary via ping seguro.
- `render.yaml` passou a listar `CLOUDINARY_URL`, `FRONTEND_URL`, `RESEND_API_KEY` e `EMAIL_FROM` como variaveis esperadas.

## Validacao complementar executada

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
- `npm run lint` passou com avisos antigos, sem erro bloqueante.

## O que precisa ser feito agora

### 1. Corrigir storage definitivo de imagens

Prioridade: critica antes de beta com pessoas reais.

Tarefas:

- Abrir o painel do Render e verificar o valor exato de `CLOUDINARY_URL`.
- Garantir formato `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`, sem aspas no Render.
- Conferir `/api/health`; `mediaStorage` deve estar como `cloudinary_configured`.
- Conferir `/api/health/media`; deve responder `cloudinary_ready`.
- Confirmar no Cloudinary se API key, API secret e cloud name estao corretos.
- Fazer upload teste pelo endpoint `/api/upload/post-image`.
- Se Cloudinary continuar instavel, migrar upload para Supabase Storage, Cloudflare R2 ou S3.
- Confirmar que producao nao depende de storage local.

Aceite:

- Uma foto postada no celular continua visivel apos redeploy/restart do backend.

### 2. Teste manual mobile do caminho principal

Prioridade: critica.

Roteiro:

- Criar conta nova no celular.
- Editar perfil.
- Enviar foto de perfil.
- Criar post com texto.
- Criar post so com foto.
- Criar post com texto e foto.
- Abrir feed em outra conta.
- Curtir, comentar, denunciar e bloquear.
- Confirmar que usuario bloqueado some de feed/busca/chat.

Aceite:

- Fluxo completo funciona em iPhone e Android, sem erro interno.

### 3. Moderacao operacional

Prioridade: alta.

Status: adiado para depois da beta inicial.

Tarefas:

- Manter denuncia e bloqueio funcionando no app.
- Revisar denuncias manualmente no banco durante a beta pequena.
- Criar painel interno somente quando houver volume real de denuncias.
- Definir antes as regras de acao: remover conteudo, advertir, suspender ou banir.

Aceite:

- A beta pequena consegue lidar com denuncias sem expor uma ferramenta administrativa incompleta.

### 4. Politicas obrigatorias para beta

Prioridade: alta.

Tarefas:

- Criar termos de uso.
- Criar politica de privacidade.
- Criar regras de comunidade.
- Definir idade minima.
- Definir o que acontece com dados de usuario, fotos e denuncias.

Aceite:

- Links aparecem no cadastro/login e aceite fica obrigatorio ao criar conta.

### 5. Recuperacao de senha real

Prioridade: media-alta.

Status: implementado com provedor Resend opcional.

Tarefas:

- Integrado envio de e-mail real via Resend quando `RESEND_API_KEY` estiver configurado.
- Criada tela de solicitar reset.
- Criada tela de redefinir senha por token.
- Tokens continuam expirando apos 1 hora.
- Refresh tokens do usuario sao revogados apos troca de senha.

Aceite:

- Usuario consegue recuperar acesso sem suporte manual quando `RESEND_API_KEY`, `EMAIL_FROM` e `FRONTEND_URL` estiverem configurados no Render.

### 6. Testes de integracao e e2e

Prioridade: media-alta.

Tarefas:

- Teste de auth: cadastro, login, refresh.
- Teste de post com imagem.
- Teste de feed com bloqueio.
- Teste de perfil publico com bloqueio.
- Teste de chat direto com bloqueio.
- Um Playwright mobile: cadastro -> editar perfil -> postar foto -> comentar -> bloquear.

Aceite:

- Mudancas criticas quebram teste antes de chegar em producao.

### 7. Ajustes de performance e UX

Prioridade: media.

Tarefas:

- Fazer code splitting para reduzir chunk principal.
- Trocar mensagens soltas por toast padrao.
- Melhorar loading/erro no feed e perfil.
- Tornar notificacoes clicaveis.

Aceite:

- App abre melhor no celular e erros ficam compreensiveis para usuarias beta.

## Proximos passos recomendados

1. Configurar `CLOUDINARY_URL`, `FRONTEND_URL`, `RESEND_API_KEY` e `EMAIL_FROM` no Render.
2. Fazer teste manual mobile completo apos deploy.
3. Revisar textos de termos de uso, politica de privacidade e regras da comunidade.
4. Testar recuperacao de senha com e-mail real.
5. Adicionar testes de integracao para bloqueio: feed, busca, perfil e chat.
6. Criar e2e Playwright mobile do caminho principal.
7. Validar Supabase backups/PITR e politica de retencao.

## Rodada complementar: storage e recuperação de senha

Commit previsto desta rodada:

- `Add password reset screens and storage health`

Arquivos alterados:

- `server/src/config/env.ts`
- `server/.env.example`
- `server/src/server.ts`
- `server/src/modules/upload/upload.routes.ts`
- `server/src/modules/auth/services/auth.service.ts`
- `server/src/modules/auth/controllers/auth.controller.ts`
- `src/api.js`
- `src/App.jsx`
- `src/features/auth/LoginScreen.jsx`
- `src/features/auth/ForgotPasswordScreen.jsx`
- `src/features/auth/ResetPasswordScreen.jsx`
- `README.md`
- `docs/beta-hardening-2026-09-11.md`

O que foi feito:

- `CLOUDINARY_URL` passou a ser lido pelo `env.ts`, mantendo configuracao centralizada.
- `/api/health` passou a indicar se o app esta usando `cloudinary_configured`, `missing_cloudinary_url` ou `local_dev_fallback` para midia.
- Criado fluxo visual de "Esqueci minha senha".
- Criada tela publica `/reset-password` para receber token por link.
- Backend envia e-mail de redefinicao via Resend quando `RESEND_API_KEY` esta configurado.
- Em desenvolvimento, o token ainda aparece na resposta/log para facilitar teste local.
- Em producao, token nao e exposto na API.

Variaveis necessarias no Render:

- `CLOUDINARY_URL`: storage persistente de imagens.
- `FRONTEND_URL`: URL publica do Vercel, usada para gerar links de reset.
- `RESEND_API_KEY`: chave do provedor de e-mail.
- `EMAIL_FROM`: remetente validado no Resend.

Risco restante:

- Sem `RESEND_API_KEY`, o endpoint de recuperacao responde genericamente por seguranca, mas nenhum e-mail real e enviado.

## Rodada complementar: retirada do painel e base legal

Commit previsto desta rodada:

- `Add beta legal pages`

Arquivos alterados:

- `server/.env.example`
- `server/src/modules/moderation/moderation.routes.ts`
- `server/src/modules/moderation/moderation.service.ts`
- `server/src/modules/moderation/moderation.service.test.ts`
- `src/api.js`
- `src/App.jsx`
- `src/features/auth/LoginScreen.jsx`
- `src/features/legal/LegalScreen.jsx`
- `README.md`
- `docs/beta-hardening-2026-09-11.md`

O que foi feito:

- Removido painel interno de moderacao criado na rodada anterior.
- Removida dependencia de `ADMIN_EMAILS`.
- Mantidos denuncia e bloqueio, que sao as protecoes importantes para beta.
- Criadas paginas publicas de termos, privacidade e regras da comunidade.
- Cadastro agora exige aceite dos textos antes de criar conta.
- Login recebeu links para os textos legais.

Validações:

- `npm test -- --runInBand`
- `npm run build`
- `cd server && npm test`
- `cd server && npm run build`

Risco restante:

- Os textos legais ainda sao base inicial operacional. Antes de lancamento publico amplo, precisam de revisao juridica.

## Rodada complementar: fotos persistentes e texto legivel no mobile

Data: 2026-09-11

Arquivos alterados:

- `src/api.js`
- `src/index.css`
- `src/features/profile/Profile.jsx`
- `src/features/feed/HomeFeed.jsx`
- `src/features/profile/UserProfileScreen.jsx`
- `src/features/chat/ChatList.jsx`
- `src/features/search/SearchScreen.jsx`
- `docs/beta-hardening-2026-09-11.md`

Problemas tratados:

- Foto de perfil podia parecer carregada na tela, mas nao ficava salva se a usuaria nao clicasse em "Salvar".
- Imagens locais retornadas como `/uploads/...` podiam quebrar quando `VITE_API_URL` apontava para uma origem diferente de `VITE_WS_URL`.
- Avatar/post podia aparecer em uma tela e quebrar em outra, porque cada tela montava a URL de midia manualmente.
- Em smartphones com modo escuro, campos de texto podiam herdar texto claro/branco enquanto o fundo do input continuava branco ou claro.

O que foi feito:

- Criado `ASSET_BASE_URL` em `src/api.js`, derivado de `VITE_API_URL` quando essa variavel existir.
- Criado helper unico `resolveAssetUrl(url)` em `src/api.js`.
- Feed, perfil publico, chat, busca e tela de perfil passaram a usar `resolveAssetUrl`.
- Upload de avatar agora salva o `avatarUrl` no backend imediatamente apos o upload.
- Estado global do usuario e atualizado depois do salvamento do avatar.
- Adicionada regra global em `src/index.css` para `input`, `textarea` e `select` manterem texto escuro, cursor escuro e placeholder cinza.
- Adicionado tratamento para `-webkit-autofill`, cobrindo Chrome/Safari mobile.

Validações executadas:

- `npm run build`
- `npm run lint`

Resultado:

- Build do frontend passou.
- Lint passou com warnings antigos ja existentes no projeto.

Observacao importante para producao:

- Fotos so persistem de verdade em producao se `CLOUDINARY_URL` estiver configurado no Render.
- Sem Cloudinary, qualquer armazenamento local em Render/free tier pode sumir apos restart ou novo deploy.
- O endpoint `/api/health/media` deve retornar sucesso antes de liberar upload de fotos para beta.

Nota sobre moderacao:

- O painel interno/admin de moderacao foi removido na rodada "retirada do painel e base legal".
- O que continua no produto e intencional para beta: denunciar post, denunciar perfil, bloquear usuario e aplicar bloqueios no feed, busca, perfil e chat.
- Durante beta pequena, denuncias podem ser revisadas manualmente no banco. Um painel operacional so deve voltar quando houver volume real e regras claras para moderadores.
