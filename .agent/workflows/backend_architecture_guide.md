# Arquitetura de Referência: API Segura em Cloudflare Workers (DELETE)

**Problema**: Erros 403 Forbidden intermitentes e segurança de API.
**Solução**: Autenticação Stateless via JWT, Autorização baseada em Token (não body) e "Security by Obscurity" (404) para recursos de terceiros.

## 1. Fluxo de Decisão (Autorização)

```mermaid
graph TD
    A[Request DELETE /videos/:id] --> B{Possui JWT?}
    B -- Não --> C[401 Unauthorized]
    B -- Sim --> D[Decodificar Token (Role & UserID)]
    D --> E[Buscar Vídeo no DB]
    E -- Não Encontrado --> F[404 Not Found]
    E -- Encontrado --> G{IsAdmin OR IsOwner?}
    G -- Não --> F[404 Not Found (Segurança)]
    G -- Sim --> H[Deletar Storage (R2)]
    H --> I[Deletar DB Record]
    I --> J[204 No Content]
```

## 2. Implementação de Referência (TypeScript/Hono)

### Middleware de Autenticação (`middleware/auth.ts`)
```typescript
import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new HTTPException(401, { message: 'CREDENTIALS_REQUIRED' });
    }
    const token = authHeader.split(' ')[1];
    
    try {
        const payload = await verify(token, c.env.JWT_SECRET);
        c.set('jwtPayload', payload); // Injeta contexto seguro
        await next();
    } catch {
        throw new HTTPException(401, { message: 'INVALID_TOKEN' });
    }
};
```

### Controller Seguro (`controllers/video.ts`)

```typescript
export const deleteVideo = async (c: Context) => {
    const id = c.req.param('id');
    const payload = c.get('jwtPayload'); // Contexto confiável
    const db = c.env.DB;

    // 1. Busca Metadata (Owner check)
    const { results } = await db.prepare("SELECT user_id, r2_key FROM videos WHERE id = ?").bind(id).all();
    const video = results[0];

    // 2. Resource Not Found (ou já deletado)
    if (!video) return c.body(null, 404);

    // 3. Authorization Guard
    // isOwner: compara user_id do token com user_id do banco
    const isOwner = String(payload.sub) === String(video.user_id);
    const isAdmin = payload.role === 'admin';

    if (!isOwner && !isAdmin) {
        // Retorna 404 para evitar enumeração de IDs por atacantes
        return c.body(null, 404);
    }

    // 4. Deleção Segura
    await Promise.allSettled([
        c.env.R2.delete(video.r2_key),      // Storage
        db.prepare("DELETE...").run()       // DB
    ]);

    return c.body(null, 204);
};
```

## 3. Checklist de Testes

1.  [ ] **Unitário**: Testar se `deleteVideo` retorna 401 sem token.
2.  [ ] **Unitário**: Testar se `deleteVideo` retorna 404 quando vídeo não existe.
3.  [ ] **Segurança**: Testar se User A tentando deletar vídeo de User B recebe **404** (não 403).
4.  [ ] **Integração**: Testar Admin deletando vídeo de qualquer um (deve ser 204).
5.  [ ] **Regressão**: Garantir que deletar vídeo órfão de storage não quebre a deleção do banco.
