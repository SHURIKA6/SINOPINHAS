// =====================================================================
// [server.js] - CÓDIGO COMPLETO COM PROTEÇÃO E MELHORIAS
// =====================================================================

import { Hono } from 'hono';
import { Pool } from '@neondatabase/serverless';
import axios from 'axios';

// UTILITY: Hashing de Senha
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

// UTILITY: Função de Consulta ao Banco
async function queryDB(sql, params, env) {
    if (!env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
    
    const pool = new Pool({
        connectionString: env.DATABASE_URL,
    });
    try {
        const result = await pool.query(sql, params);
        return result;
    } finally {
        await pool.end();
    }
}

// UTILITY: Log de Auditoria FORENSE COMPLETO
async function logAudit(user_id, action, meta, c) {
    try {
        // ========================================
        // 1. CAPTURAR IP REAL (não proxy)
        // ========================================
        const cfConnectingIP = c.req.header('CF-Connecting-IP');
        const xForwardedFor = c.req.header('X-Forwarded-For');
        const xRealIP = c.req.header('X-Real-IP');
        
        let realIP = cfConnectingIP || xRealIP || 'unknown';
        if (xForwardedFor && !cfConnectingIP) {
            realIP = xForwardedFor.split(',')[0].trim();
        }

        // ========================================
        // 2. CAPTURAR DADOS DE GEOLOCALIZAÇÃO
        // ========================================
        const cfCountry = c.req.header('CF-IPCountry') || null;
        const cfCity = c.req.header('CF-IPCity') || null;
        const cfRegion = c.req.header('CF-Region') || null;
        const cfTimezone = c.req.header('CF-Timezone') || null;
        const cfLatitude = c.req.header('CF-IPLatitude') || null;
        const cfLongitude = c.req.header('CF-IPLongitude') || null;
        const cfASN = c.req.header('CF-Connecting-ASN') || null;

        // ========================================
        // 3. CAPTURAR INFORMAÇÕES DO NAVEGADOR
        // ========================================
        const userAgent = c.req.header('User-Agent') || 'unknown';
        const acceptLanguage = c.req.header('Accept-Language') || null;
        const referer = c.req.header('Referer') || 'direct';
        const dnt = c.req.header('DNT') || '0';

        // ========================================
        // 4. DETECTAR SISTEMA OPERACIONAL
        // ========================================
        let os = 'Unknown';
        if (userAgent.match(/Windows NT 10/i)) os = 'Windows 10';
        else if (userAgent.match(/Windows NT 11/i)) os = 'Windows 11';
        else if (userAgent.match(/Windows/i)) os = 'Windows';
        else if (userAgent.match(/Mac OS X/i)) os = 'macOS';
        else if (userAgent.match(/iPhone/i)) os = 'iOS (iPhone)';
        else if (userAgent.match(/iPad/i)) os = 'iOS (iPad)';
        else if (userAgent.match(/Android/i)) os = 'Android';
        else if (userAgent.match(/Linux/i)) os = 'Linux';

        // ========================================
        // 5. DETECTAR NAVEGADOR
        // ========================================
        let browser = 'Unknown';
        if (userAgent.match(/Edg\//i)) browser = 'Edge';
        else if (userAgent.match(/Chrome/i)) browser = 'Chrome';
        else if (userAgent.match(/Firefox/i)) browser = 'Firefox';
        else if (userAgent.match(/Safari/i)) browser = 'Safari';
        else if (userAgent.match(/Opera|OPR/i)) browser = 'Opera';

        // ========================================
        // 6. DETECTAR TIPO DE DISPOSITIVO
        // ========================================
        let deviceType = 'Desktop';
        if (userAgent.match(/iPhone/i)) deviceType = 'iPhone';
        else if (userAgent.match(/iPad/i)) deviceType = 'iPad';
        else if (userAgent.match(/Android.*Mobile/i)) deviceType = 'Android Mobile';
        else if (userAgent.match(/Android/i)) deviceType = 'Android Tablet';
        else if (userAgent.match(/Mobile|Tablet/i)) deviceType = 'Mobile';

        // ========================================
        // 7. CAPTURAR FINGERPRINT DO CLIENTE
        // ========================================
        const fingerprint = meta.fingerprint || null;
        const screenResolution = meta.screen || null;
        const browserLanguage = meta.language || acceptLanguage;
        const clientTimezone = meta.timezone || cfTimezone;

        // ========================================
        // 8. DETECTAR ISP (via ASN)
        // ========================================
        let isp = null;
        if (cfASN) {
            // Você pode fazer lookup de ASN aqui, mas por enquanto salvamos o ASN
            isp = `ASN ${cfASN}`;
        }

        const safeUserId = (typeof user_id === 'number' || (typeof user_id === 'string' && !isNaN(user_id))) 
            ? parseInt(user_id) : null;
        
        // ========================================
        // 9. MONTAR OBJETO COMPLETO DE METADATA
        // ========================================
        const enrichedMeta = {
            ...meta,
            tracking: {
                dnt: dnt,
                referer: referer,
                language: browserLanguage,
                screen: screenResolution,
                timezone: clientTimezone
            }
        };

        // ========================================
        // 10. SALVAR NO BANCO COM TODOS OS DADOS
        // ========================================
        await queryDB(
            `INSERT INTO audit_logs (
                user_id, action, ip, user_agent, details, device_type,
                country, city, region, latitude, longitude, asn, isp,
                browser, os, screen_resolution, language, timezone, fingerprint
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
            [
                safeUserId, 
                action, 
                realIP, 
                userAgent, 
                JSON.stringify(enrichedMeta), 
                deviceType,
                cfCountry,
                cfCity,
                cfRegion,
                cfLatitude ? parseFloat(cfLatitude) : null,
                cfLongitude ? parseFloat(cfLongitude) : null,
                cfASN,
                isp,
                browser,
                os,
                screenResolution,
                browserLanguage,
                clientTimezone,
                fingerprint
            ],
            c.env
        );
    } catch (err) {
        console.error("FALHA AO GRAVAR LOG:", err.message);
    }
}
// =====================================================================

// Buscar todos os usuários (para inbox)
app.get("/api/users/all", async (c) => {
    const env = c.env;

    try {
        const { rows } = await queryDB(
            "SELECT id, username, avatar, bio FROM users ORDER BY username ASC",
            [],
            env
        );
        return c.json(rows);
    } catch (err) {
        console.error("Erro ao listar usuários:", err);
        return c.json({ error: "Erro ao listar usuários" }, 500);
    }
});


// UTILITY: Criar Notificação
async function createNotification(userId, type, message, relatedId, env) {
    try {
        await queryDB(
            "INSERT INTO notifications (user_id, type, message, related_id) VALUES ($1, $2, $3, $4)",
            [userId, type, message, relatedId],
            env
        );
    } catch (err) {
        console.error("Erro ao criar notificação:", err);
    }
}

// UTILITY: Rate Limiting para Upload (5 vídeos por dia)
async function checkUploadLimit(userId, env) {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { rows } = await queryDB(
            "SELECT COUNT(*) as count FROM upload_history WHERE user_id = $1 AND uploaded_at > $2",
            [userId, oneDayAgo],
            env
        );
        return parseInt(rows[0].count) < 5;
    } catch (err) {
        console.error("Erro ao verificar limite de upload:", err);
        return true;
    }
}

// UTILITY: Rate Limiting para Comentários (1 comentário a cada 10 segundos)
async function checkCommentLimit(userId, env) {
    try {
        const tenSecondsAgo = new Date(Date.now() - 10 * 1000).toISOString();
        const { rows } = await queryDB(
            "SELECT COUNT(*) as count FROM comment_history WHERE user_id = $1 AND commented_at > $2",
            [userId, tenSecondsAgo],
            env
        );
        return parseInt(rows[0].count) === 0;
    } catch (err) {
        console.error("Erro ao verificar limite de comentário:", err);
        return true;
    }
}

const app = new Hono();

// Middleware de CORS
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
        const errorMsg = err.message || "Erro desconhecido ao registrar.";
        if (errorMsg.includes('duplicate key')) {
            return c.json({ error: "Username já existe" }, 409);
        }
        return c.json({ error: "Falha de DB: " + errorMsg }, 500);
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

// ATUALIZAR PERFIL
app.put('/api/users/:id', async (c) => {
    const userId = parseInt(c.req.param('id'));
    const { password, avatar, bio } = await c.req.json();
    const env = c.env;

    try {
        let updates = [];
        let params = [];
        let paramIndex = 1;

        if (password) {
            const hash = await hashPassword(password);
            updates.push(`password = $${paramIndex++}`);
            params.push(hash);
        }
        if (avatar !== undefined) {
            updates.push(`avatar = $${paramIndex++}`);
            params.push(avatar);
        }
        if (bio !== undefined) {
            updates.push(`bio = $${paramIndex++}`);
            params.push(bio);
        }

        if (updates.length === 0) {
            return c.json({ error: "Nenhuma alteração fornecida" }, 400);
        }

        params.push(userId);
        const result = await queryDB(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, avatar, bio`,
            params,
            env
        );

        if (result.rowCount === 0) {
            return c.json({ error: "Usuário não encontrado" }, 404);
        }

        await logAudit(userId, "UPDATE_PROFILE", { updates }, c);
        return c.json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao atualizar perfil:", err);
        return c.json({ error: "Erro ao atualizar perfil" }, 500);
    }
});

// NOTIFICAÇÕES
app.get('/api/notifications/:user_id', async (c) => {
    const userId = parseInt(c.req.param('user_id'));
    const env = c.env;

    try {
        const { rows } = await queryDB(
            `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [userId],
            env
        );
        return c.json(rows);
    } catch (err) {
        console.error("Erro ao buscar notificações:", err);
        return c.json({ error: "Erro ao buscar notificações" }, 500);
    }
});

app.post('/api/notifications/:id/read', async (c) => {
    const notifId = parseInt(c.req.param('id'));
    const env = c.env;

    try {
        await queryDB(
            `UPDATE notifications SET is_read = TRUE WHERE id = $1`,
            [notifId],
            env
        );
        return c.json({ success: true });
    } catch (err) {
        return c.json({ error: "Erro ao marcar notificação" }, 500);
    }
});

// =====================================================================
// [ROTAS DE ADMIN]
// =====================================================================

app.post('/api/admin/login', async (c) => {
    const body = await c.req.json(); 
    
    if (body.password === c.env.ADMIN_PASSWORD) {
        return c.json({ success: true });
    }
    
    return c.json({ error: "Senha incorreta" }, 401);
});

app.get("/api/admin/users", async (c) => {
    const adminPasswordFromQuery = c.req.query('admin_password');
    const env = c.env;

    if (adminPasswordFromQuery !== env.ADMIN_PASSWORD) {
        return c.json({ error: "Senha de admin incorreta" }, 403);
    }
    try {
        const { rows } = await queryDB("SELECT id, username, bio, created_at, avatar FROM users ORDER BY id DESC LIMIT 50", [], env);
        return c.json(rows);
    } catch (err) { 
        console.error("Erro ao listar usuários:", err);
        return c.json({ error: "Erro ao listar usuários: Falha no DB" }, 500); 
    }
});

app.get("/api/admin/logs", async (c) => {
    const adminPasswordFromQuery = c.req.query('admin_password');
    const env = c.env;

    if (adminPasswordFromQuery !== env.ADMIN_PASSWORD) {
        return c.json({ error: "Acesso Negado: Credenciais Inválidas" }, 403);
    }
    try {
        const { rows } = await queryDB(`
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

app.delete("/api/admin/users/:id", async (c) => {
    const id = parseInt(c.req.param('id')); 
    const { admin_password } = await c.req.json();
    const env = c.env;

    if (admin_password !== env.ADMIN_PASSWORD) return c.json({ error: "Acesso Negado" }, 403);
    
    try { 
        await queryDB("DELETE FROM comments WHERE user_id = $1", [id], env);
        await queryDB("DELETE FROM video_reactions WHERE user_id = $1", [id], env);
        await queryDB("DELETE FROM videos WHERE user_id = $1", [id], env);
        await queryDB("DELETE FROM audit_logs WHERE user_id = $1", [id], env);
        await queryDB("DELETE FROM video_likes WHERE user_id = $1", [id], env);
        await queryDB("DELETE FROM notifications WHERE user_id = $1", [id], env);
        await queryDB("DELETE FROM upload_history WHERE user_id = $1", [id], env);
        await queryDB("DELETE FROM comment_history WHERE user_id = $1", [id], env);

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

app.post("/api/admin/reset-password", async (c) => {
    const { user_id, admin_password } = await c.req.json();
    const env = c.env;
    
    if (admin_password !== env.ADMIN_PASSWORD) return c.json({ error: "Acesso Negado" }, 403);
    
    try {
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
// [ROTAS DE VÍDEO COM PROTEÇÕES]
// =====================================================================

app.post('/api/upload', async (c) => {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const thumbnailFile = formData.get("thumbnail");
    const title = formData.get("title");
    const user_id = formData.get("user_id");
    const is_restricted = formData.get("is_restricted");

    const API_KEY = c.env.BUNNY_API_KEY;
    const LIBRARY_ID = c.env.BUNNY_LIBRARY_ID;
    
    if (!user_id || !file || typeof file === 'string') return c.json({ error: "Arquivo obrigatório" }, 400);

    // PROTEÇÃO 1: Verificar se usuário existe
    const userCheck = await queryDB("SELECT id FROM users WHERE id = $1", [parseInt(user_id)], c.env);
    if (userCheck.rows.length === 0) {
        await logAudit(user_id, "UPLOAD_FAILED_UNAUTH", { reason: "User ID not found" }, c);
        return c.json({ error: "Acesso negado. Faça login para continuar." }, 401);
    }

    // PROTEÇÃO 2: Rate Limiting (5 vídeos por dia)
    const canUpload = await checkUploadLimit(parseInt(user_id), c.env);
    if (!canUpload) {
        await logAudit(user_id, "UPLOAD_BLOCKED_RATE_LIMIT", { reason: "Exceeded daily limit" }, c);
        return c.json({ error: "Limite de 5 uploads por dia atingido. Tente amanhã!" }, 429);
    }

    // PROTEÇÃO 3: Validar tamanho do arquivo (500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
        await logAudit(user_id, "UPLOAD_FAILED_SIZE", { size: file.size }, c);
        return c.json({ error: "Arquivo muito grande! Máximo: 500MB" }, 413);
    }

    // PROTEÇÃO 4: Validar tipo de arquivo
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'];
    if (!allowedTypes.includes(file.type)) {
        await logAudit(user_id, "UPLOAD_FAILED_TYPE", { type: file.type }, c);
        return c.json({ error: "Formato inválido! Use MP4, WebM, OGG, MOV ou AVI" }, 415);
    }

    try {
        // Upload para BunnyCDN
        const createRes = await axios.post(
            `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
            { title: title },
            { headers: { AccessKey: API_KEY } }
        );
        const videoGuid = createRes.data.guid;

        await axios.put(
            `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoGuid}`,
            file,
            { headers: { AccessKey: API_KEY, "Content-Type": "application/octet-stream" } }
        );

        // Thumbnail será null por enquanto (pode ser expandido)
        let thumbnailUrl = null;

        // Salvar no banco
        await queryDB(
            "INSERT INTO videos (title, user_id, bunny_id, is_restricted, thumbnail_url) VALUES ($1, $2, $3, $4, $5)",
            [title, parseInt(user_id), videoGuid, is_restricted === 'true', thumbnailUrl],
            c.env
        );

        // Registrar no histórico de uploads
        await queryDB(
            "INSERT INTO upload_history (user_id) VALUES ($1)",
            [parseInt(user_id)],
            c.env
        );

        await logAudit(user_id, "UPLOAD_VIDEO", { title, service: "BunnyCDN", restricted: is_restricted === 'true' }, c);
        return c.json({ success: true });

    } catch (error) {
        console.error("Erro no Upload:", error.response?.data || error.message);
        return c.json({ error: "Falha ao enviar vídeo para o servidor de streaming" }, 500);
    }
});

// Listar Vídeos Públicos
app.get("/api/videos", async (c) => {
    const userId = c.req.query('user_id');
    const env = c.env;

    try {
        let query = `
            SELECT 
                v.*, 
                u.username, 
                u.avatar,
                (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id) as likes
        `;

        if (userId) {
            query += `,
                (SELECT COUNT(*) > 0 FROM video_likes WHERE video_id = v.id AND user_id = $1) as user_liked
            `;
        }

        query += `
            FROM videos v
            LEFT JOIN users u ON v.user_id = u.id
            WHERE v.is_restricted = FALSE
            ORDER BY v.created_at DESC LIMIT 50
        `;

        const { rows } = await queryDB(query, userId ? [parseInt(userId)] : [], env);
        return c.json(rows);
    } catch (err) {
        console.error("Erro ao buscar vídeos:", err);
        return c.json({ error: "Erro ao buscar vídeos" }, 500);
    }
});

// Listar Vídeos Secretos
app.get("/api/secret-videos", async (c) => {
    const userId = c.req.query('user_id');
    const env = c.env;

    try {
        let query = `
            SELECT 
                v.*, 
                u.username, 
                u.avatar,
                (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id) as likes
        `;

        if (userId) {
            query += `,
                (SELECT COUNT(*) > 0 FROM video_likes WHERE video_id = v.id AND user_id = $1) as user_liked
            `;
        }

        query += `
            FROM videos v
            LEFT JOIN users u ON v.user_id = u.id
            WHERE v.is_restricted = TRUE
            ORDER BY v.created_at DESC LIMIT 50
        `;

        const { rows } = await queryDB(query, userId ? [parseInt(userId)] : [], env);
        return c.json(rows);
    } catch (err) {
        console.error("Erro ao buscar conteúdo restrito:", err);
        return c.json({ error: "Erro ao buscar conteúdo restrito" }, 500);
    }
});

// Like/Unlike Vídeo
app.post("/api/videos/:id/like", async (c) => {
    const videoId = parseInt(c.req.param('id'));
    const { user_id } = await c.req.json();
    const env = c.env;

    try {
        const existing = await queryDB(
            "SELECT * FROM video_likes WHERE video_id = $1 AND user_id = $2",
            [videoId, user_id],
            env
        );

        if (existing.rows.length > 0) {
            await queryDB(
                "DELETE FROM video_likes WHERE video_id = $1 AND user_id = $2",
                [videoId, user_id],
                env
            );
        } else {
            await queryDB(
                "INSERT INTO video_likes (video_id, user_id) VALUES ($1, $2)",
                [videoId, user_id],
                env
            );

            const videoData = await queryDB("SELECT user_id, title FROM videos WHERE id = $1", [videoId], env);
            if (videoData.rows[0] && videoData.rows[0].user_id !== user_id) {
                await createNotification(
                    videoData.rows[0].user_id,
                    'like',
                    `Alguém curtiu seu vídeo: ${videoData.rows[0].title}`,
                    videoId,
                    env
                );
            }
        }

        return c.json({ success: true });
    } catch (err) {
        console.error("Erro ao dar like:", err);
        return c.json({ error: "Erro ao dar like" }, 500);
    }
});

// Incrementar Views
app.post("/api/videos/:id/view", async (c) => {
    const videoId = parseInt(c.req.param('id'));
    const env = c.env;

    try {
        await queryDB(
            "UPDATE videos SET views = COALESCE(views, 0) + 1 WHERE id = $1",
            [videoId],
            env
        );
        return c.json({ success: true });
    } catch (err) {
        console.error("Erro ao incrementar view:", err);
        return c.json({ error: "Erro ao incrementar view" }, 500);
    }
});

// Deletar Vídeo
app.delete("/api/videos/:id", async (c) => {
    const videoId = parseInt(c.req.param('id'));
    const { adminPassword, userId } = await c.req.json();
    const env = c.env;

    const isAuthorized = adminPassword === env.ADMIN_PASSWORD || (userId && !isNaN(parseInt(userId)));

    if (!isAuthorized) {
        return c.json({ error: "Autorização necessária" }, 401);
    }

    try {
        await queryDB("DELETE FROM comments WHERE video_id = $1", [videoId], env);
        await queryDB("DELETE FROM video_reactions WHERE video_id = $1", [videoId], env);
        await queryDB("DELETE FROM video_likes WHERE video_id = $1", [videoId], env);
        
        const videoResult = await queryDB("SELECT bunny_id FROM videos WHERE id = $1", [videoId], env);
        const bunnyId = videoResult.rows[0]?.bunny_id;

        if (bunnyId && env.BUNNY_API_KEY && env.BUNNY_LIBRARY_ID) {
            await axios.delete(
                `https://video.bunnycdn.com/library/${env.BUNNY_LIBRARY_ID}/videos/${bunnyId}`,
                { headers: { AccessKey: env.BUNNY_API_KEY } }
            );
        }

        let deleteQuery;
        if (adminPassword === env.ADMIN_PASSWORD) {
            deleteQuery = "DELETE FROM videos WHERE id = $1 RETURNING id";
        } else {
            deleteQuery = "DELETE FROM videos WHERE id = $1 AND user_id = $2 RETURNING id";
        }
        
        const result = await queryDB(deleteQuery, adminPassword === env.ADMIN_PASSWORD ? [videoId] : [videoId, parseInt(userId)], env);

        if (result.rowCount === 0) {
            return c.json({ error: "Vídeo não encontrado ou acesso negado." }, 404);
        }
        
        return c.json({ success: true });

    } catch (error) {
        console.error("Erro no DELETE de Vídeo (Final):", error); 
        return c.json({ error: "Erro interno ao deletar o vídeo." }, 500);
    }
});

// =====================================================================
// [ROTAS SOCIAIS]
// =====================================================================

app.post("/api/mural", async (c) => {
    const { user_id, msg } = await c.req.json();
    const env = c.env;

    try {
        let mural = await env.MURAL_STORE.get('mural_messages', { type: 'json' }) || [];
        
        const userQuery = await queryDB("SELECT username FROM users WHERE id = $1", [user_id], env);
        const username = userQuery.rows[0]?.username || "Anônimo";

        const newPost = { user_id, username, msg, created_at: new Date().toISOString() };
        mural.push(newPost);
        
        if (mural.length > 40) mural = mural.slice(mural.length - 40);
        await env.MURAL_STORE.put('mural_messages', JSON.stringify(mural));

        await logAudit(user_id, "MURAL_POST", { msg }, c);
        return c.json({ ok: true });

    } catch (e) {
        console.error("Erro ao postar no mural:", e);
        return c.json({ error: "Erro ao postar no mural" }, 500);
    }
});

app.get("/api/mural", async (c) => {
    try {
        const mural = await c.env.MURAL_STORE.get('mural_messages', { type: 'json' }) || [];
        return c.json({ mural });
    } catch (e) {
        return c.json({ error: "Erro ao ler mural" }, 500);
    }
});

app.post("/api/send-message", async (c) => {
    const { from_id, to_id, msg } = await c.req.json();
    const env = c.env;

    try {
        await queryDB(
            "INSERT INTO inbox (from_id, to_id, msg) VALUES ($1, $2, $3)",
            [parseInt(from_id), parseInt(to_id), msg], env
        );

        await createNotification(
            parseInt(to_id),
            'message',
            'Você recebeu uma nova mensagem',
            parseInt(from_id),
            env
        );

        await logAudit(from_id, "SEND_MSG", { to_id }, c);
        return c.json({ ok: true });
    } catch (err) {
        return c.json({ error: "Erro ao enviar mensagem." }, 500);
    }
});

app.get("/api/inbox/:user_id", async (c) => {
    const user_id = c.req.param('user_id');
    const env = c.env;

    try {
        const { rows } = await queryDB(
            `SELECT i.*, u1.username as from_username, u2.username as to_username
             FROM inbox i
             LEFT JOIN users u1 ON i.from_id = u1.id
             LEFT JOIN users u2 ON i.to_id = u2.id
             WHERE i.to_id = $1 OR i.from_id = $1
             ORDER BY i.created_at DESC LIMIT 40`,
            [parseInt(user_id)], env
        );
        return c.json(rows);
    } catch (err) {
        console.error("Erro ao buscar inbox:", err);
        return c.json({ error: "Erro ao buscar caixa de mensagens." }, 500);
    }
});

// Buscar Comentários
app.get("/api/comments/:video_id", async (c) => {
    const video_id = c.req.param('video_id');
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

// Enviar Comentário (COM PROTEÇÃO)
app.post("/api/comment", async (c) => {
    const { video_id, user_id, comment } = await c.req.json();
    const env = c.env;

    // PROTEÇÃO: Rate Limiting (1 comentário a cada 10 segundos)
    const canComment = await checkCommentLimit(parseInt(user_id), env);
    if (!canComment) {
        await logAudit(user_id, "COMMENT_BLOCKED_RATE_LIMIT", { video_id }, c);
        return c.json({ error: "Aguarde 10 segundos antes de comentar novamente!" }, 429);
    }

    try {
        await queryDB(
            "INSERT INTO comments (video_id, user_id, comment) VALUES ($1, $2, $3)",
            [parseInt(video_id), parseInt(user_id), comment], 
            env
        );

        // Registrar no histórico de comentários
        await queryDB(
            "INSERT INTO comment_history (user_id) VALUES ($1)",
            [parseInt(user_id)],
            env
        );

        const videoData = await queryDB("SELECT user_id, title FROM videos WHERE id = $1", [video_id], env);
        if (videoData.rows[0] && videoData.rows[0].user_id !== user_id) {
            await createNotification(
                videoData.rows[0].user_id,
                'comment',
                `Novo comentário no seu vídeo: ${videoData.rows[0].title}`,
                video_id,
                env
            );
        }

        await logAudit(user_id, "COMMENT", { video_id, comment }, c); 
        return c.json({ ok: true });
    } catch (err) {
        console.error("Erro ao inserir comentário:", err);
        return c.json({ error: "Erro ao enviar comentário" }, 500);
    }
});

// Deletar Comentário
app.delete("/api/comments/:id", async (c) => {
    const commentId = parseInt(c.req.param('id'));
    const { user_id, admin_password } = await c.req.json();
    const env = c.env;

    try {
        let deleteQuery;
        if (admin_password === env.ADMIN_PASSWORD) {
            deleteQuery = "DELETE FROM comments WHERE id = $1 RETURNING id";
        } else {
            deleteQuery = "DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id";
        }

        const result = await queryDB(
            deleteQuery,
            admin_password === env.ADMIN_PASSWORD ? [commentId] : [commentId, parseInt(user_id)],
            env
        );

        if (result.rowCount === 0) {
            return c.json({ error: "Comentário não encontrado ou sem permissão" }, 404);
        }

        await logAudit(user_id, "DELETE_COMMENT", { comment_id: commentId }, c);
        return c.json({ success: true });
    } catch (err) {
        console.error("Erro ao deletar comentário:", err);
        return c.json({ error: "Erro ao deletar comentário" }, 500);
    }
});

// =====================================================================
// [HANDLERS FINAIS]
// =====================================================================

app.get("/health", (c) => c.json({ ok: true }));
app.all("*", (c) => c.json({ error: "not found" }, 404));

export default {
    async fetch(request, env, ctx) {
        return app.fetch(request, env, ctx);
    },
};
