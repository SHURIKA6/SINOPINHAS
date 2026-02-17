# SINOPINHAS — Resumo Técnico e Guia de Desenvolvimento

> Criado por **Fernando** ([@SHURIKA6](https://github.com/SHURIKA6)) — Sinop, MT 🇧🇷

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
- CORS: restringir origens em produção (dinâmico via `ALLOWED_ORIGINS`).
- Uploads: validação de magic bytes implementada em `file-validation.js`.
- Sanitização: já há `xss` e validação com `zod` — manter e expandir testes.
- Logs: `console.log` de debug convertidos para `console.warn`; `console.error` mantido para erros reais.

Correções aplicadas
- ✅ CORS dinâmico por origem do request
- ✅ Removido fallback inseguro de token em `localStorage`
- ✅ Validação de magic bytes no upload
- ✅ Constantes centralizadas em `backend/src/utils/constants.js`
- ✅ Schema limpo (indexes duplicados removidos)
- ✅ Log levels corrigidos (`console.log` → `console.warn`)

Tarefas futuras
1. Adicionar linter, formatação e CI (GitHub Actions).
2. Escrever testes unitários para utilitários críticos.
3. Migrar gradualmente para TypeScript.

Como começar a contribuir
- Rodar a stack localmente (ver seção acima).
- Ler rotas em `backend/src/routes` e controllers em `backend/src/controllers` para entender fluxos.
- Propor PRs pequenos: ex.: endurecer validações, adicionar testes, ou corrigir problemas de segurança.

Contato
- **Autor:** SHURA ([@SHURIKA6](https://github.com/SHURIKA6))
- **Instagram:** [@_riad777](https://instagram.com/_riad777)
- **Repositório:** [github.com/SHURIKA6/SINOPINHAS](https://github.com/SHURIKA6/SINOPINHAS)

