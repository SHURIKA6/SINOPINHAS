// =====================================================================
// [server.js] - CÓDIGO CORRIGIDO PARA CLOUDFLARE WORKERS (Hono)
// =====================================================================

// 1. IMPORTS E CONFIGURAÇÃO (Usando ES Modules)
import { Hono } from 'hono';
import { Pool } from '@neondatabase/serverless';
import axios from 'axios';

// 2. UTILITY: Hashing de Senha (Substitui bcrypt com Web Crypto API)
async function hashPassword(password) {
    const saltKey = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, true, ['sign', 'verify']);
    const passwordBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.sign('HMAC', saltKey, passwordBuffer);
    const exportedKey = await crypto.subtle.exportKey('jwk', saltKey);
    return JSON.stringify({
        salt: exportedKey,
        hash: Array.from(new Uint8Array(hashBuffer))
    });
}

async function comparePassword(password, storedHashJSON) {
    try {
        const { salt, hash } = JSON.parse(storedHashJSON);
        const saltKey = await crypto.subtle.importKey(
            'jwk', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
        );
        const passwordBuffer = new TextEncoder().encode(password);
        const newHashBuffer = await crypto.subtle.sign('HMAC', saltKey, passwordBuffer);
        const newHashArray = Array.from(new Uint8Array(newHashBuffer));
        return newHashArray.every((byte, i) => byte === hash[i]);
    } catch (e) {
        return false;
    }
}
// 3. UTILITY: Função de Consulta ao Banco (Usa Pool do Neon)
// server.js (Trecho da função queryDB)
async function queryDB(sql, params, env) {
    
    if (!env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
    
    const pool = new Pool({
        connectionString: env.DATABASE_URL,
        // REMOVA esta linha ou comente-a:
        // ssl: { rejectUnauthorized: false } 
    });
    try {
        const result = await pool.query(sql, params);
        return result;
    } finally {
        await pool.end();
    }
}

// 4. UTILITY: Log de Auditoria (Acessa cabeçalhos da Cloudflare)
async function logAudit(user_id, action, meta, c) {
    try {
        const ip = c.req.header('CF-Connecting-IP') || 'unknown';
        const userAgent = c.req.header('User-Agent') || 'unknown';

        // Lógica de identificação do dispositivo (mantida)
        let deviceType = 'PC';
        if (userAgent.match(/Mobi|Android|iPhone|iPad|Tablet|Nexus|Silk/i)) {
            deviceType = 'Mobile';
        } else if (userAgent.match(/Windows|Macintosh|Linux/i)) {
            deviceType = 'PC';
        } else {
            deviceType = 'Outro';
        }

        const safeUserId = (typeof user_id === 'number' || (typeof user_id === 'string' && !isNaN(user_id))) 
            ? parseInt(user_id) : null;
        
        await queryDB(
            "INSERT INTO audit_logs (user_id, action, ip, user_agent, details, device_type) VALUES ($1, $2, $3, $4, $5, $6)",
            [safeUserId, action, ip, userAgent, JSON.stringify(meta), deviceType],
            c.env
        );
    } catch (err) {
        console.error("FALHA AO GRAVAR LOG:", err.message);
    }
}

// 5. O APLICATIVO HONO (Substitui o Express)
const app = new Hono();

// Middleware de CORS (Substitui require("cors"))
app.use('*', async (c, next) => {
    c.res.headers.set('Access-Control-Allow-Origin', '*');
    c.res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');

    if (c.req.method === 'OPTIONS') {
        return c.body(null, 204);
    }
    await next();
});


// =====================================================================
// [ROTAS DE AUTENTICAÇÃO]
// =====================================================================

app.post('/api/register', async (c) => {
    const { username, password, avatar, bio } = await c.req.json();
    const env = c.env;

    if (!username || !password) return c.json({ error: "Usuário e senha obrigatórios" }, 400);
    
    try {
        const hash = await hashPassword(password);
        const result = await queryDB(
            "INSERT INTO users (username, password, avatar, bio) VALUES ($1, $2, $3, $4) RETURNING id, username, avatar, bio;",
            [username.toLowerCase(), hash, avatar || "", bio || ""], env
        );
        await logAudit(result.rows[0].id, "REGISTER", { username }, c);
        return c.json({ user: result.rows[0] });
    } catch (err) { 
    // Mude a resposta 400 para expor o erro real para fins de depuração
    // A string 'duplicate key' é o erro real do DB
    const errorMsg = err.message || "Erro desconhecido ao registrar.";
    if (errorMsg.includes('duplicate key')) {
        return c.json({ error: "Username já existe" }, 409); // 409 Conflict
    }
    // Para todos os outros erros, mostre o erro real do DB (Ex: falha de permissão)
    return c.json({ error: "Falha de DB: " + errorMsg }, 500); // Mude para 500
  }
});

app.post('/api/login', async (c) => {
    const { username, password } = await c.req.json();
    const env = c.env;
    
    const { rows } = await queryDB("SELECT * FROM users WHERE username = $1", [username.toLowerCase()], env);
    if (!rows.length) return c.json({ error: "Usuário/senha inválido" }, 401);
    
    const user = rows[0];
    const ok = await comparePassword(password, user.password);
    
    if (!ok) return c.json({ error: "Usuário/senha inválido" }, 401);
    
    await logAudit(user.id, "LOGIN", {}, c);
    return c.json({ user: { id: user.id, username: user.username, avatar: user.avatar, bio: user.bio } });
});

// server.js (Substitua todo o bloco de rotas de admin pelo código abaixo)

// --- ROTA 1: ADMIN LOGIN (POST) ---
app.post('/api/admin/login', async (c) => {
    // CORREÇÃO: Lê o corpo JSON antes de acessar a propriedade
    const body = await c.req.json(); 
    
    // Agora verifica a propriedade do objeto 'body' com o segredo do Worker
    if (body.password === c.env.ADMIN_PASSWORD) {
        return c.json({ success: true });
    }
    
    // Se a senha estiver errada, retorna 401
    return c.json({ error: "Senha incorreta" }, 401);
});

// --- ROTA 2: GERENCIAR USUÁRIOS (GET) ---
app.get("/api/admin/users", async (c) => {
    // O Hono lê a senha da query string (admin_password=...)
    const adminPasswordFromQuery = c.req.query('admin_password');
    const env = c.env;

    if (adminPasswordFromQuery !== env.ADMIN_PASSWORD) {
        return c.json({ error: "Senha de admin incorreta" }, 403); // 403 Forbidden
    }
    try {
        const { rows } = await queryDB("SELECT id, username, bio, created_at, avatar FROM users ORDER BY id DESC LIMIT 50", [], env);
        return c.json(rows);
    } catch (err) { 
        console.error("Erro ao listar usuários:", err);
        return c.json({ error: "Erro ao listar usuários: Falha no DB" }, 500); 
    }
});

// --- ROTA 3: RASTREAMENTO/LOGS (GET) ---
app.get("/api/admin/logs", async (c) => {
    // O Hono lê a senha da query string (admin_password=...)
    const adminPasswordFromQuery = c.req.query('admin_password');
    const env = c.env;

    if (adminPasswordFromQuery !== env.ADMIN_PASSWORD) {
        return c.json({ error: "Acesso Negado: Credenciais Inválidas" }, 403); // 403 Forbidden
    }
    try {
        const { rows } = await queryDB(`
            -- Seleciona todas as colunas de 'a' e o username, INCLUINDO device_type
            SELECT a.*, u.username, a.device_type
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC LIMIT 100
        `, [], env);
        return c.json(rows);
    } catch (err) {
        console.error("Erro ao buscar logs:", err);
        return c.json({ error: "Erro ao buscar logs: Falha no DB" }, 500);
    }
});

// server.js (Adicionar ao bloco de rotas de administração)

// server.js (Apenas a rota DELETE /api/admin/users/:id)

app.delete("/api/admin/users/:id", async (c) => {
    const id = parseInt(c.req.param('id')); 
    const { admin_password } = await c.req.json();
    const env = c.env;

    if (admin_password !== env.ADMIN_PASSWORD) return c.json({ error: "Acesso Negado" }, 403);
    
    try { 
        // 1. Limpar TODAS as referências
        await queryDB("DELETE FROM comments WHERE user_id = $1", [id], env);
        await queryDB("DELETE FROM video_reactions WHERE user_id = $1", [id], env);
        await queryDB("DELETE FROM videos WHERE user_id = $1", [id], env);
        // NOVO: Limpar Audit Logs associados ao usuário
        await queryDB("DELETE FROM audit_logs WHERE user_id = $1", [id], env); // <-- ADICIONE ESTA LINHA

        // 2. Apagar o usuário principal
        const result = await queryDB("DELETE FROM users WHERE id = $1", [id], env);
        
        if (result.rowCount === 0) {
            return c.json({ error: "Usuário não encontrado." }, 404);
        }
        
        return c.json({ success: true });
    } catch (err) {
        console.error("Erro fatal ao banir usuário (DB):", err); 
        return c.json({ error: "Erro interno ao banir usuário." }, 500);
    }
});

// --- ROTA POST: RESETAR SENHA ---
app.post("/api/admin/reset-password", async (c) => {
    const { user_id, admin_password } = await c.req.json();
    const env = c.env;
    
    if (admin_password !== env.ADMIN_PASSWORD) return c.json({ error: "Acesso Negado" }, 403);
    
    try {
        // Hashing da senha padrão "123456" com Web Crypto (substitui bcrypt)
        const hash = await hashPassword("123456"); 
        
        const result = await queryDB("UPDATE users SET password = $1 WHERE id = $2 RETURNING id", [hash, user_id], env);
        
        if (result.rowCount === 0) {
            return c.json({ error: "Usuário não encontrado." }, 404);
        }

        return c.json({ success: true });
    } catch(err) {
        console.error("Erro ao resetar senha:", err);
        return c.json({ error: "Erro interno ao resetar senha." }, 500);
    }
});

// =====================================================================
// [ROTAS DE VÍDEO E UPLOAD]
// =====================================================================

// --- UPLOAD VÍDEO COM BUNNYCDN (Substitui multer) ---
app.post('/api/upload', async (c) => {
    // c.req.formData() substitui multer para lidar com arquivos no Workers
    const formData = await c.req.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const user_id = formData.get("user_id");
    const is_restricted = formData.get("is_restricted");

    const API_KEY = c.env.BUNNY_API_KEY;
    const LIBRARY_ID = c.env.BUNNY_LIBRARY_ID;
    
    if (!user_id || !file || typeof file === 'string') return c.json({ error: "Arquivo obrigatório" }, 400);

    // 1. Verificar se o usuário existe (Segurança)
    const userCheck = await queryDB("SELECT id FROM users WHERE id = $1", [parseInt(user_id)], c.env);
    if (userCheck.rows.length === 0) {
        await logAudit(user_id, "UPLOAD_FAILED_UNAUTH", { reason: "User ID not found" }, c);
        return c.json({ error: "Acesso negado. Faça login para continuar." }, 401);
    }

    try {
        // 2. Criar o vídeo no BunnyCDN
        const createRes = await axios.post(
            `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
            { title: title },
            { headers: { AccessKey: API_KEY } }
        );
        const videoGuid = createRes.data.guid;

        // 3. Enviar o conteúdo do arquivo (Upload)
        // file.stream() é a forma Workers-friendly de obter o corpo do arquivo
        await axios.put(
            `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoGuid}`,
            file, // Passa o objeto File/Blob diretamente (ou use await file.arrayBuffer())
            { headers: { AccessKey: API_KEY, "Content-Type": "application/octet-stream" } }
        );

        // 4. Salvar no Banco com a nova coluna is_restricted
        await queryDB(
            "INSERT INTO videos (title, user_id, bunny_id, is_restricted) VALUES ($1, $2, $3, $4)",
            [title, parseInt(user_id), videoGuid, is_restricted === 'true' || false], c.env
        );

        await logAudit(user_id, "UPLOAD_VIDEO", { title, service: "BunnyCDN", restricted: is_restricted === 'true' }, c);
        return c.json({ success: true });

    } catch (error) {
        console.error("Erro no Upload:", error.response?.data || error.message);
        return c.json({ error: "Falha ao enviar vídeo para o servidor de streaming" }, 500);
    }
});

// --- Listar Conteúdo Restrito ---
app.get("/api/secret/videos", async (c) => {
    try {
        const { rows } = await queryDB(`
            SELECT v.*, u.username, u.avatar FROM videos v
            LEFT JOIN users u ON v.user_id = u.id
            WHERE v.is_restricted = TRUE
            ORDER BY v.created_at DESC LIMIT 50
        `, [], c.env);
        return c.json(rows);
    } catch (err) {
        return c.json({ error: "Erro ao buscar conteúdo restrito" }, 500);
    }
});

// --- Listar Vídeos (Página Principal - Filtrado) ---
app.get("/api/videos", async (c) => {
    const { rows } = await queryDB(`
        SELECT v.*, u.username, u.avatar FROM videos v
        LEFT JOIN users u ON v.user_id = u.id
        WHERE v.is_restricted = FALSE
        ORDER BY v.created_at DESC LIMIT 50
    `, [], c.env);
    return c.json(rows);
});

// --- Deletar Vídeo (Admin ou Dono) ---
app.delete("/api/videos/:id", async (c) => {
    const videoId = parseInt(c.req.param('id'));
    const { adminPassword, userId } = await c.req.json();
    const env = c.env;

    const isAuthorized = adminPassword === env.ADMIN_PASSWORD || (userId && !isNaN(parseInt(userId)));

    if (!isAuthorized) {
        await logAudit(userId || 'anon', "DELETE_VIDEO_ATTEMPT_DENIED", { videoId }, c);
        return c.json({ error: "Autorização necessária" }, 401);
    }

    try {
        let result;
        if (adminPassword === env.ADMIN_PASSWORD) {
            result = await queryDB("DELETE FROM videos WHERE id = $1 RETURNING id", [videoId], env);
        } else {
            result = await queryDB("DELETE FROM videos WHERE id = $1 AND user_id = $2 RETURNING id", [videoId, parseInt(userId)], env);
        }

        if (result.rowCount === 0) {
            await logAudit(userId || 'anon', "DELETE_VIDEO_FAILED_NOT_FOUND", { videoId }, c);
            return c.json({ error: "Vídeo não encontrado ou acesso negado." }, 404);
        }

        await logAudit(userId || 'admin', "DELETE_VIDEO_SUCCESS", { videoId }, c);
        return c.json({ success: true });

    } catch (err) {
        console.error("Erro ao deletar vídeo:", err);
        return c.json({ error: "Erro interno ao deletar" }, 500);
    }
});


// =====================================================================
// [ROTAS SOCIAIS E FEEDBACK]
// =====================================================================

// (Demais rotas sociais e de admin traduzidas para a sintaxe Hono e queryDB...)

// --- Mural/Inbox (Substitui FS com KV Store) ---
app.post("/api/mural", async (c) => {
    const { user_id, msg } = await c.req.json();
    const env = c.env;

    try {
        // 1. Pega o mural atual
        let mural = await env.MURAL_STORE.get('mural_messages', { type: 'json' }) || [];
        
        // (Busca o username no DB para o post, se necessário)
        
        const newPost = { user_id, msg, created_at: new Date().toISOString() };
        mural.push(newPost);
        
        // 2. Limita e salva no KV
        if (mural.length > 40) mural = mural.slice(mural.length - 40);
        await env.MURAL_STORE.put('mural_messages', JSON.stringify(mural));

        await logAudit(user_id, "MURAL_POST", { msg }, c);
        return c.json({ ok: true });

    } catch (e) {
        return c.json({ error: "Erro ao postar no mural" }, 500);
    }
});

app.get("/api/mural", async (c) => {
    // Lê o mural do KV Store
    try {
        const mural = await c.env.MURAL_STORE.get('mural_messages', { type: 'json' }) || [];
        return c.json({ mural });
    } catch (e) {
        return c.json({ error: "Erro ao ler mural" }, 500);
    }
});

// server.js (Adicionar ao bloco de rotas sociais/de feedback)

// --- ROTA DE BUSCA DE COMENTÁRIOS (GET) ---
app.get("/api/comments/:video_id", async (c) => {
    const { video_id } = c.req.param();
    const env = c.env;

    if (!video_id || isNaN(parseInt(video_id))) {
        return c.json({ error: "ID de vídeo inválido" }, 400);
    }
    
    try {
        const { rows } = await queryDB(
            `SELECT c.*, u.username, u.avatar FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.video_id = $1 ORDER BY c.created_at DESC LIMIT 30`, 
            [parseInt(video_id)], 
            env
        );
        return c.json(rows);
    } catch (err) { 
        console.error("Erro ao buscar comentários:", err);
        return c.json({ error: "Erro interno ao buscar comentários" }, 500); 
    }
});

// --- ROTA DE ENVIO DE COMENTÁRIOS (POST) ---
app.post("/api/comment", async (c) => {
    const { video_id, user_id, comment } = await c.req.json();
    const env = c.env;

    try {
        await queryDB(
            "INSERT INTO comments (video_id, user_id, comment) VALUES ($1, $2, $3)",
            [parseInt(video_id), parseInt(user_id), comment], 
            env
        );
        // Não temos o 'req' no worker, usando 'c' para logAudit
        await logAudit(user_id, "COMMENT", { video_id, comment }, c); 
        return c.json({ ok: true });
    } catch (err) {
        console.error("Erro ao inserir comentário:", err);
        return c.json({ error: "Erro ao enviar comentário" }, 500);
    }
});

// ... Outras rotas de admin (como logs, users, etc.) seguiriam a mesma conversão ...

// =====================================================================
// [STARTUP E HANDLERS FINAIS]
// =====================================================================

app.get("/health", (c) => c.json({ ok: true }));
app.all("*", (c) => c.json({ error: "not found" }, 404));

// 6. EXPORT DEFAULT HANDLER PARA CLOUDFLARE WORKERS
export default {
    /**
     * @param {Request} request
     * @param {Env} env O objeto de ambiente (contém vars, secrets e bindings KV).
     * @param {ExecutionContext} ctx
     */
    async fetch(request, env, ctx) {
        return app.fetch(request, env, ctx);
    },
};