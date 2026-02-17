# SINOPINHAS — Resumo Técnico e Guia de Desenvolvimento

Resumo rápido
- Aplicação: rede social local para Sinop (vídeos, fotos, notícias, eventos, chat, notificações).
- Arquitetura: Frontend Next.js (React) + Backend Cloudflare Worker (`hono`) com Postgres (Neon Serverless). Armazenamento de mídia em Cloudflare R2. Deploy backend via Wrangler.

Como executar localmente (desenvolvimento)

Pré-requisitos
- Node.js 18+ e npm
- Wrangler CLI (Cloudflare Workers): `npm i -g wrangler`
- Conta Neon/Postgres ou string de conexão para `DATABASE_URL`
- Cloudflare account com R2 e KV (ou mocks locais)

Passos
1. Frontend
   - cd `frontend`
   - `npm install`
   - `npm run dev`
   - Acesse `http://localhost:3000`

2. Backend (local via Wrangler)
   - cd `backend`
   - `npm install`
   - Configurar variáveis de ambiente (exemplo mínimo):
     - `DATABASE_URL` — string de conexão PostgreSQL (Neon)
     - `JWT_SECRET` — segredo para JWT
     - `R2_PUBLIC_DOMAIN` — domínio público para objetos R2
   - Segredos (wrangler secrets):
     - `wrangler secret put ADMIN_PASSWORD`
     - `wrangler secret put VAPID_PRIVATE_KEY`
   - Iniciar em modo dev: `wrangler dev`
   - `wrangler deploy` para publicar (requer configuração de conta Cloudflare)

Variáveis de ambiente importantes
- DATABASE_URL
- JWT_SECRET
- R2_PUBLIC_DOMAIN
- (wrangler secrets) ADMIN_PASSWORD, VAPID_PRIVATE_KEY
- Outros bindings: `VIDEO_BUCKET` (R2), `MURAL_STORE` (KV)

Segurança e melhores práticas (checklist)
- Não versionar segredos: mover chaves privadas para `wrangler secret put`.
- Autenticação: usar cookie HttpOnly para sessão; evitar armazenar tokens em `localStorage`.
- CORS: restringir origens em produção.
- Uploads: validar magic bytes e limitar tipos e tamanhos no servidor.
- Sanitização: já há `xss` e validação com `zod` — manter e expandir testes.
- Revisar logs e remover prints sensíveis em produção.

Correções sugeridas aplicadas neste commit
- `frontend/services/api.js`: removido fallback inseguro que inseria tokens no header via `localStorage` e removido armazenamento de token no localStorage durante login/registro.
- `frontend/hooks/useAuth.js`: confiando em `checkSession()` via cookie HttpOnly por padrão; localStorage usado apenas como conveniência para armazenar perfil (sem confiar como fonte de verdade).

Tarefas recomendadas (prioridade)
1. Corrigir CORS para lista de origens em produção.
2. Validar conteúdo de arquivos (magic bytes) no backend antes de armazenar no R2.
3. Remover duplicações e limpar `backend/src/db/schema.js`.
4. Adicionar linter, formatação e CI (GitHub Actions).
5. Escrever testes unitários para utilitários críticos.

Como começar a contribuir
- Rodar a stack localmente (ver seção acima).
- Ler rotas em `backend/src/routes` e controllers em `backend/src/controllers` para entender fluxos.
- Propor PRs pequenos: ex.: endurecer validações, adicionar testes, ou corrigir problemas de segurança.

Contato
- Repositório local — use as issues e PRs para discutir alterações estruturais.
