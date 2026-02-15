import { queryDB } from '../db/index.js';
import { logAudit } from '../middleware/audit.js';
import { sanitize } from '../utils/sanitize.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';
import { notifyUser } from '../utils/push-utils.js';
import { getAchievementList } from '../utils/user-achievements.js';
import { sendToGoogleSheets } from '../utils/google-sheets.js';

// Função: Alternar like em um vídeo
export const likeVideo = async (c) => {
    const videoId = c.req.param("id");
    const env = c.env;
    const payload = c.get('jwtPayload');
    const userId = payload?.id;

    if (userId === undefined || userId === null) {
        return createErrorResponse(c, "UNAUTHORIZED", "Você precisa estar logado para curtir", 401);
    }

    try {
        const { rows: existing } = await queryDB(
            "SELECT * FROM likes WHERE video_id = $1 AND user_id = $2",
            [videoId, userId],
            env
        );

        if (existing.length > 0) {
            await queryDB("DELETE FROM likes WHERE video_id = $1 AND user_id = $2", [videoId, userId], env);
            c.executionCtx.waitUntil(sendToGoogleSheets('likes', { action: 'UNLIKE', video_id: videoId, user_id: userId }, env));
        } else {
            await queryDB("INSERT INTO likes (video_id, user_id) VALUES ($1, $2)", [videoId, userId], env);
            c.executionCtx.waitUntil(sendToGoogleSheets('likes', { action: 'LIKE', video_id: videoId, user_id: userId }, env));
        }

        return createResponse(c, { success: true });
    } catch (err) {
        if (err.code === '42P01') {
            await queryDB(`
                CREATE TABLE IF NOT EXISTS likes (
                    id SERIAL PRIMARY KEY,
                    video_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(video_id, user_id)
                )
            `, [], env);

            if (userId) {
                await queryDB("INSERT INTO likes (video_id, user_id) VALUES ($1, $2)", [videoId, userId], env);
                return createResponse(c, { success: true, repaired: true });
            }
        }
        throw err;
    }
};

// Função: Registrar visualização de vídeo
export const viewVideo = async (c) => {
    const videoId = c.req.param("id");
    const env = c.env;
    let userId = null;

    try {
        // Usar JWT payload se disponível — NUNCA confiar no body.user_id (IDOR)
        const payload = c.get('jwtPayload');
        userId = payload?.id ?? null;

        // Processa em segundo plano para não bloquear o player/UI
        c.executionCtx.waitUntil((async () => {
            try {
                await queryDB("INSERT INTO views (video_id, user_id) VALUES ($1, $2)", [videoId, userId], env);
            } catch (err) {
                console.error("Error logging view in background:", err.message);

                // Reparo de esquema em segundo plano se necessário
                if (err.code === '42P01') {
                    await queryDB(`
                        CREATE TABLE IF NOT EXISTS views (
                            id SERIAL PRIMARY KEY,
                            video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
                            user_id INTEGER,
                            created_at TIMESTAMP DEFAULT NOW()
                        )
                    `, [], env);
                } else if (err.code === '42703' || err.message.includes('user_id')) {
                    await queryDB("ALTER TABLE views ADD COLUMN IF NOT EXISTS user_id INTEGER", [], env);
                }
            }
        })());

        return createResponse(c, { success: true });
    } catch (err) {
        // Erro crítico antes do processamento (raro, ex: JSON inválido)
        return createResponse(c, { success: true, warning: err.message });
    }
};

// Função: Postar novo comentário
export const postComment = async (c) => {
    const env = c.env;
    try {
        const { video_id, comment } = await c.req.json();
        const payload = c.get('jwtPayload');
        const user_id = payload?.id;

        if (user_id === undefined || user_id === null) return createErrorResponse(c, "UNAUTHORIZED", "Não logado", 401);
        const cleanComment = sanitize(comment);

        if (!cleanComment || !cleanComment.trim()) {
            return createErrorResponse(c, "INVALID_INPUT", "Comentário vazio", 400);
        }

        await queryDB(
            "INSERT INTO comments (video_id, user_id, comment) VALUES ($1, $2, $3)",
            [video_id, user_id, cleanComment],
            env
        );

        c.executionCtx.waitUntil(sendToGoogleSheets('comments', {
            action: 'NEW_COMMENT', video_id, user_id, comment: cleanComment.substring(0, 100)
        }, env));

        // Processamento de notificações em segundo plano (não bloqueia a resposta)
        c.executionCtx.waitUntil((async () => {
            try {
                const { rows: video } = await queryDB("SELECT user_id FROM videos WHERE id = $1", [video_id], env);
                if (video.length > 0 && video[0].user_id !== user_id) {
                    await queryDB(
                        "INSERT INTO notifications (user_id, type, related_id, message) VALUES ($1, $2, $3, $4)",
                        [video[0].user_id, "comment", video_id, "Novo comentário no seu vídeo"],
                        env
                    );
                    await notifyUser(
                        video[0].user_id,
                        "Novo Comentário! 💬",
                        "Alguém comentou no seu vídeo no SINOPINHAS.",
                        env
                    );
                }
            } catch (notifyErr) {
                console.error("Error sending background notification:", notifyErr);
            }
        })());

        return createResponse(c, { success: true });
    } catch (err) {
        if (err.code === '42P01') {
            const table = err.message.includes('comments') ? 'comments' : 'notifications';
            if (table === 'comments') {
                await queryDB(`
                    CREATE TABLE IF NOT EXISTS comments (
                        id SERIAL PRIMARY KEY,
                        video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        comment TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                `, [], env);
                await queryDB(
                    "INSERT INTO comments (video_id, user_id, comment) VALUES ($1, $2, $3)",
                    [video_id, user_id, sanitize(comment)],
                    env
                );
            } else {
                await queryDB(`
                    CREATE TABLE IF NOT EXISTS notifications (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        message TEXT NOT NULL,
                        is_read BOOLEAN DEFAULT FALSE,
                        type TEXT,
                        related_id INTEGER,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                `, [], env);
            }
            return createResponse(c, { success: true, repaired: true });
        }
        throw err;
    }
};

// Função: Listar comentários de um vídeo
export const getComments = async (c) => {
    const videoId = c.req.param("videoId");
    const env = c.env;

    if (!videoId) {
        return createErrorResponse(c, "INVALID_PARAM", "ID do vídeo não fornecido", 400);
    }

    try {
        const { rows } = await queryDB(
            `SELECT c.*, u.username, u.avatar 
             FROM comments c 
             LEFT JOIN users u ON c.user_id = u.id 
             WHERE c.video_id = $1 
             ORDER BY c.created_at DESC`,
            [videoId],
            env
        );
        return createResponse(c, rows);
    } catch (err) {
        console.error("Error in getComments:", err.code, err.message);

        // Tabela não existe
        if (err.code === '42P01') {
            try {
                await queryDB(`
                    CREATE TABLE IF NOT EXISTS comments (
                        id SERIAL PRIMARY KEY,
                        video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        comment TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                `, [], env);
                return createResponse(c, []);
            } catch (e) {
                return createErrorResponse(c, "DB_ERROR", "Falha ao criar tabela de comentários", 500, e.message);
            }
        }

        // Coluna ausente ou erro de tipo
        if (err.code === '42703' || err.code === '42804' || err.message.includes('column')) {
            try {
                console.log("🛠️ Tentando reparar esquema da tabela comments...");
                await queryDB("ALTER TABLE comments ADD COLUMN IF NOT EXISTS video_id INTEGER", [], env);
                await queryDB("ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id INTEGER", [], env);
                await queryDB("ALTER TABLE comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()", [], env);

                try {
                    const { rows } = await queryDB(
                        `SELECT c.*, u.username, u.avatar 
                         FROM comments c 
                         LEFT JOIN users u ON c.user_id = u.id 
                         WHERE c.video_id = $1 
                         ORDER BY c.created_at DESC`,
                        [videoId],
                        env
                    );
                    return createResponse(c, rows);
                } catch (innerErr) {
                    console.warn("⚠️ Recuperação com JOIN falhou, tentando fallback simples:", innerErr.message);
                    const { rows: simpleRows } = await queryDB(
                        "SELECT * FROM comments WHERE video_id = $1 ORDER BY created_at DESC",
                        [videoId],
                        env
                    );
                    return createResponse(c, simpleRows);
                }
            } catch (repairErr) {
                return createErrorResponse(c, "DB_ERROR", "Falha ao reparar esquema de comentários", 500, repairErr.message);
            }
        }

        return createErrorResponse(c, "DB_ERROR", `Erro ao buscar comentários: ${err.message}`, 500);
    }
};

// Função: Remover um comentário
export const deleteComment = async (c) => {
    const commentId = c.req.param("id");
    const env = c.env;
    try {
        const payload = c.get('jwtPayload');
        const current_user_id = payload?.id;
        const isAdmin = payload?.role === 'admin';

        if (!isAdmin) {
            const { rows } = await queryDB("SELECT user_id FROM comments WHERE id = $1", [commentId], env);
            if (rows.length === 0 || rows[0].user_id !== current_user_id) {
                return createErrorResponse(c, "FORBIDDEN", "Não autorizado para deletar este comentário", 403);
            }
        }

        await queryDB("DELETE FROM comments WHERE id = $1", [commentId], env);
        return createResponse(c, { success: true });
    } catch (err) {
        throw err;
    }
};

// Função: Listar notificações do usuário
export const getNotifications = async (c) => {
    const userIdParam = c.req.param("userId");
    const env = c.env;
    const payload = c.get('jwtPayload');
    const authId = payload?.id;

    // Segurança: Usuário só vê suas próprias notificações (ou admin)
    if (authId?.toString() !== userIdParam?.toString() && payload?.role !== 'admin') {
        return createErrorResponse(c, "FORBIDDEN", "Acesso negado às notificações", 403);
    }

    // Se for admin "puro" (sem ID numérico), ele não tem notificações no banco
    if (isNaN(parseInt(authId))) {
        return createResponse(c, []);
    }

    try {
        const { rows } = await queryDB(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            [authId],
            env
        );
        return createResponse(c, rows);
    } catch (err) {
        if (err.code === '42P01') {
            await queryDB(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    message TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    type TEXT,
                    related_id INTEGER,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `, [], env);
            return createResponse(c, []);
        }
        throw err;
    }
};

// Função: Listar todos os usuários com conquistas
export const listAllUsers = async (c) => {
    const env = c.env;
    try {
        // Inicialização de segurança: garante que a coluna FALSE não seja NULL para usuários antigos
        c.executionCtx.waitUntil(queryDB("UPDATE users SET discovered_logs = FALSE WHERE discovered_logs IS NULL", [], env).catch(() => { }));

        const { rows } = await queryDB(
            `SELECT u.id, u.username, u.avatar, u.bio, u.role, u.discovered_logs,
            (SELECT COUNT(*) FROM videos WHERE user_id = u.id) as video_count,
            (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as comment_count_made,
            (SELECT COUNT(*) FROM likes WHERE user_id = u.id) as likes_given,
            (SELECT COUNT(*) FROM likes l JOIN videos v ON l.video_id = v.id WHERE v.user_id = u.id) as total_likes_received,
            (SELECT COUNT(*) FROM users u2 WHERE u2.id <= u.id) as global_rank
            FROM users u ORDER BY u.username ASC`,
            [],
            env
        );

        const decorated = rows.map(u => ({
            ...u,
            achievements: getAchievementList(u)
        }));

        return createResponse(c, decorated);
    } catch (err) {
        return createResponse(c, []);
    }
};

// Função: Obter dados do perfil público
export const getPublicProfile = async (c) => {
    const userId = c.req.param("id");
    const env = c.env;

    try {
        const { rows } = await queryDB(
            `SELECT id, username, avatar, bio, role, discovered_logs, created_at,
            (SELECT COUNT(*) FROM videos WHERE user_id = users.id) as video_count,
            (SELECT COUNT(*) FROM comments WHERE user_id = users.id) as comment_count_made,
            (SELECT COUNT(*) FROM likes WHERE user_id = users.id) as likes_given,
            (SELECT COUNT(*) FROM likes l JOIN videos v ON l.video_id = v.id WHERE v.user_id = users.id) as total_likes_received,
            (SELECT COUNT(*) FROM users u2 WHERE u2.id <= users.id) as global_rank
            FROM users WHERE id = $1`,
            [userId],
            env
        );

        if (rows.length === 0) return createErrorResponse(c, "NOT_FOUND", "Usuário não encontrado", 404);

        const u = rows[0];
        const decorated = {
            ...u,
            achievements: getAchievementList(u)
        };

        return createResponse(c, decorated);
    } catch (err) {
        return createErrorResponse(c, "DB_ERROR", err.message, 500);
    }
};

// Função: Filtrar usuários por tipo de conquista
export const getUsersByAchievement = async (c) => {
    const type = c.req.param("type")?.toLowerCase();
    const env = c.env;

    try {
        let sql = `SELECT id, username, avatar, bio, role, discovered_logs,
                   (SELECT COUNT(*) FROM videos WHERE user_id = users.id) as video_count,
                   (SELECT COUNT(*) FROM comments WHERE user_id = users.id) as comment_count_made,
                   (SELECT COUNT(*) FROM likes WHERE user_id = users.id) as likes_given,
                   (SELECT COUNT(*) FROM likes l JOIN videos v ON l.video_id = v.id WHERE v.user_id = users.id) as total_likes_received
                   FROM users `;

        if (type === 'pioneiro') {
            sql += " WHERE (SELECT COUNT(*) FROM users u2 WHERE u2.id <= users.id) <= 50";
        } else if (type === 'admin') {
            sql += " WHERE role = 'admin'";
        } else if (type === 'criador') {
            sql += " WHERE (SELECT COUNT(*) FROM videos WHERE user_id = users.id) > 0";
        } else if (type === 'diretor') {
            sql += " WHERE (SELECT COUNT(*) FROM videos WHERE user_id = users.id) > 10";
        } else if (type === 'popular') {
            sql += " WHERE (SELECT COUNT(*) FROM likes l JOIN videos v ON l.video_id = v.id WHERE v.user_id = users.id) >= 30";
        } else if (type === 'influenciador') {
            sql += " WHERE (SELECT COUNT(*) FROM likes l JOIN videos v ON l.video_id = v.id WHERE v.user_id = users.id) >= 100";
        } else if (type === 'tagarela') {
            sql += " WHERE (SELECT COUNT(*) FROM comments WHERE user_id = users.id) >= 10";
        } else if (type === 'amigavel') {
            sql += " WHERE (SELECT COUNT(*) FROM likes WHERE user_id = users.id) >= 20";
        } else if (type === 'hacker') {
            sql += " WHERE discovered_logs = TRUE";
        } else if (type === 'sinopense') {
            // Keep it as is (returns everyone)
        } else {
            // Se o tipo não existe, retorna lista vazia por segurança
            sql += " WHERE 1=0";
        }

        sql += " ORDER BY username ASC LIMIT 100";

        const { rows } = await queryDB(sql, [], env);

        const decorated = rows.map(u => ({
            ...u,
            achievements: getAchievementList(u)
        }));

        return createResponse(c, decorated);
    } catch (err) {
        return createErrorResponse(c, "DB_ERROR", err.message, 500);
    }
};

// Função: Enviar mensagem privada (Inbox)
export const sendMessage = async (c) => {
    const env = c.env;
    let body;
    try {
        body = await c.req.json();
    } catch (e) {
        return createErrorResponse(c, "INVALID_JSON", "Corpo da requisição inválido", 400);
    }

    const { to_id, msg, admin_password, is_admin } = body;
    const payload = c.get('jwtPayload');
    const fId = payload?.id;

    if (fId === undefined || fId === null) return createErrorResponse(c, "UNAUTHORIZED", "Não autorizado", 401);

    const cleanMsg = sanitize(msg);
    const finalIsAdmin = (is_admin && admin_password === env.ADMIN_PASSWORD) || payload?.role === 'admin';

    // Garantir que IDs sejam números para o Postgres e evitar NaN
    // Nota: Administradores puros (sem registro no users) usam ID 0.
    const tId = parseInt(to_id);
    const numericFId = parseInt(fId);

    if (isNaN(numericFId) || isNaN(tId)) {
        return createErrorResponse(c, "INVALID_PARAM", `IDs inválidos: from=${fId}, to=${to_id}`, 400);
    }

    if (!cleanMsg) {
        return createErrorResponse(c, "INVALID_PARAM", "Mensagem vazia ou inválida", 400);
    }

    const executeInsert = async () => {
        return await queryDB(
            "INSERT INTO messages (from_id, to_id, msg, is_admin) VALUES ($1, $2, $3, $4)",
            [fId, tId, cleanMsg, finalIsAdmin],
            env
        );
    };

    try {
        await executeInsert();

        c.executionCtx.waitUntil(sendToGoogleSheets('messages', {
            action: 'SENT', from_id: numericFId, to_id: tId, is_admin: finalIsAdmin
        }, env));

        // Notificação Push para o destinatário (apenas se for usuário real e não admin purista)
        if (tId > 0) {
            c.executionCtx.waitUntil(notifyUser(
                tId,
                "Nova Mensagem! ✉️",
                "Você recebeu uma nova mensagem privada.",
                env
            ));
        }

        return createResponse(c, { success: true });
    } catch (err) {
        console.error("🔥 Error in sendMessage:", err.code, err.message);

        // Tabela não existe
        if (err.code === '42P01') {
            try {
                await queryDB(`
                    CREATE TABLE IF NOT EXISTS messages (
                        id SERIAL PRIMARY KEY,
                        from_id INTEGER NOT NULL,
                        to_id INTEGER NOT NULL,
                        msg TEXT NOT NULL,
                        is_admin BOOLEAN DEFAULT FALSE,
                        is_read BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                `, [], env);
                await executeInsert();
                return createResponse(c, { success: true, repaired_table: true });
            } catch (retryErr) {
                return createErrorResponse(c, "DB_ERROR", "Falha ao criar/inserir após erro de tabela", 500, retryErr.message);
            }
        }

        // Coluna ausente (is_admin ou is_read)
        if (err.code === '42703') {
            try {
                await queryDB("ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE", [], env);
                await queryDB("ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE", [], env);
                await executeInsert();
                return createResponse(c, { success: true, repaired_columns: true });
            } catch (retryErr) {
                return createErrorResponse(c, "DB_ERROR", "Falha ao atualizar colunas/inserir", 500, retryErr.message);
            }
        }

        // Restrição de Chave Estrangeira (Erro 23503)
        // Ocorre quando tentamos usar ID 0 (Admin) mas a tabela exige um usuário real
        if (err.code === '23503') {
            try {
                console.log("🔓 Relaxando restrições de messages para permitir Admin (ID 0)...");
                await queryDB("ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_from_id_fkey", [], env);
                await queryDB("ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_to_id_fkey", [], env);
                // Tenta novamente após remover a trava
                await executeInsert();
                return createResponse(c, { success: true, relaxed_constraints: true });
            } catch (repairErr) {
                return createErrorResponse(c, "DB_ERROR", "Falha ao relaxar restrições do banco", 500, repairErr.message);
            }
        }

        // Qualquer outro erro do banco - Retorna com Detalhes para Debug
        return createErrorResponse(c, "DB_QUERY_ERROR", "Erro ao processar mensagem no banco", 500, err.message);
    }
};

// Função: Marcar mensagens como lidas
export const markAsRead = async (c) => {
    const fromId = c.req.param("id");
    const env = c.env;
    try {
        const payload = c.get('jwtPayload');
        const userId = payload?.id;

        if (isNaN(parseInt(userId))) {
            return createResponse(c, { success: true, note: 'Admin ignore' });
        }

        await queryDB(
            "UPDATE messages SET is_read = TRUE WHERE from_id = $1 AND to_id = $2 AND is_read = FALSE",
            [fromId, parseInt(userId)],
            env
        );
        return createResponse(c, { success: true });
    } catch (err) {
        // Erro no parsing do JSON ou corpo vazio
        if (err instanceof SyntaxError || err.message?.includes('json')) {
            return createErrorResponse(c, "INVALID_JSON", "Corpo da requisição inválido ou vazio", 400);
        }

        // Tabela não existe
        if (err.code === '42P01') {
            await queryDB(`
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    from_id INTEGER NOT NULL,
                    to_id INTEGER NOT NULL,
                    msg TEXT NOT NULL,
                    is_admin BOOLEAN DEFAULT FALSE,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW()
                )
             `, [], env);
            return createResponse(c, { success: true, repaired: true });
        }
        // Coluna 'is_read' não existe (pode estar como 'read')
        if (err.code === '42703') {
            try {
                await queryDB("ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE", [], env);
                // Tenta extrair userId novamente de forma segura
                const body = await c.req.json().catch(() => ({}));
                const userId = body.userId;
                if (userId) {
                    await queryDB("UPDATE messages SET is_read = TRUE WHERE from_id = $1 AND to_id = $2", [fromId, userId], env);
                }
                return createResponse(c, { success: true, repaired_column: true });
            } catch (alterErr) {
                return createErrorResponse(c, "DB_ERROR", "Falha ao atualizar esquema de mensagens: " + alterErr.message, 500);
            }
        }
        throw err;
    }
};

// Função: Buscar conversa privada (Inbox)
export const getInbox = async (c) => {
    const userIdParam = c.req.param("userId");
    const env = c.env;
    const payload = c.get('jwtPayload');
    const authId = payload?.id;

    // Segurança: Só pode ver o próprio inbox
    if (authId?.toString() !== userIdParam?.toString() && payload?.role !== 'admin') {
        return createErrorResponse(c, "FORBIDDEN", "Acesso negado ao chat", 403);
    }

    if (!userIdParam || isNaN(parseInt(userIdParam))) {
        return createErrorResponse(c, "INVALID_PARAM", "Parâmetro 'userId' deve ser um número", 400);
    }

    const targetId = parseInt(userIdParam);

    try {
        const { rows } = await queryDB(
            `SELECT m.*, 
        uf.username as from_username, uf.avatar as from_avatar,
        ut.username as to_username, ut.avatar as to_avatar
       FROM messages m
       LEFT JOIN users uf ON m.from_id = uf.id
       LEFT JOIN users ut ON m.to_id = ut.id
       WHERE m.from_id = $1 OR m.to_id = $1
       ORDER BY m.created_at ASC`,
            [targetId],
            env
        );
        return createResponse(c, rows);
    } catch (err) {
        if (err.code === '42P01') return createResponse(c, []);
        return createResponse(c, []);
    }
};

// Função: Buscar todas as mensagens (Visão Admin)
export const getAdminInbox = async (c) => {
    const env = c.env;
    try {
        const { rows } = await queryDB(
            `SELECT m.*, 
        uf.username as from_username, uf.avatar as from_avatar,
        ut.username as to_username, ut.avatar as to_avatar
       FROM messages m
       LEFT JOIN users uf ON m.from_id = uf.id
       LEFT JOIN users ut ON m.to_id = ut.id
       ORDER BY m.created_at DESC LIMIT 100`,
            [],
            env
        );
        return createResponse(c, rows);
    } catch (err) {
        return createResponse(c, []);
    }
};

// Função: Registrar ticket de suporte
export const createSupportTicket = async (c) => {
    const env = c.env;
    try {
        const { user_id, username, reason, message } = await c.req.json();

        // Garantir que a tabela existe
        await queryDB(`
            CREATE TABLE IF NOT EXISTS support_tickets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                username TEXT,
                reason TEXT,
                message TEXT,
                status TEXT DEFAULT 'open',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `, [], env);

        const { rows } = await queryDB(
            "INSERT INTO support_tickets (user_id, username, reason, message) VALUES ($1, $2, $3, $4) RETURNING id",
            [user_id || 0, username || 'Anônimo', reason, message],
            env
        );

        await logAudit(user_id || null, "SUPPORT_TICKET_CREATED", { reason, message_length: message.length }, c);

        return createResponse(c, { id: rows[0].id });
    } catch (err) {
        return createErrorResponse(c, "DB_ERROR", err.message, 500);
    }
};

// Função: Registrar aceite dos termos
export const logTerms = async (c) => {
    try {
        const body = await c.req.json();
        await logAudit(null, "TERMS_ACCEPTED", body, c);
        return createResponse(c, { success: true });
    } catch (err) {
        throw err;
    }
};

// Função: Denunciar conteúdo (post, comentário, perfil)
export const reportContent = async (c) => {
    const env = c.env;
    const payload = c.get('jwtPayload');

    if (!payload || !payload.id) {
        return createErrorResponse(c, "UNAUTHORIZED", "Faça login para denunciar", 401);
    }

    try {
        const body = await c.req.json();
        const { content_type, content_id, reason, details } = body;

        if (!content_type || !content_id || !reason) {
            return createErrorResponse(c, "INVALID_INPUT", "Tipo, ID e motivo são obrigatórios", 400);
        }

        const validTypes = ['post', 'comment', 'profile'];
        if (!validTypes.includes(content_type)) {
            return createErrorResponse(c, "INVALID_INPUT", "Tipo de conteúdo inválido", 400);
        }

        const validReasons = ['offensive', 'spam', 'false_info', 'other'];
        if (!validReasons.includes(reason)) {
            return createErrorResponse(c, "INVALID_INPUT", "Motivo inválido", 400);
        }

        await queryDB(
            `INSERT INTO reports (reporter_id, content_type, content_id, reason, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [payload.id, content_type, parseInt(content_id), reason, sanitize(details || '')],
            env
        );

        await logAudit(payload.id, "CONTENT_REPORTED", {
            content_type, content_id, reason
        }, c);

        c.executionCtx.waitUntil(sendToGoogleSheets('reports', {
            action: 'NEW_REPORT', reporter_id: payload.id,
            content_type, content_id, reason, details: sanitize(details || '').substring(0, 100)
        }, env));

        return createResponse(c, {
            success: true,
            message: 'Denúncia registrada. Nossa equipe vai analisar.'
        });
    } catch (err) {
        // Auto-criar tabela se não existir
        if (err.code === '42P01') {
            await queryDB(`
                CREATE TABLE IF NOT EXISTS reports (
                    id SERIAL PRIMARY KEY,
                    reporter_id INTEGER,
                    content_type TEXT NOT NULL,
                    content_id INTEGER NOT NULL,
                    reason TEXT NOT NULL,
                    details TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `, [], env);
            return createErrorResponse(c, "RETRY", "Tabela criada, tente novamente", 503);
        }
        throw err;
    }
};

// Função: Marcar todas as notificações como lidas
export const markAllNotificationsRead = async (c) => {
    const env = c.env;
    const payload = c.get('jwtPayload');

    if (!payload || !payload.id) {
        return createErrorResponse(c, "UNAUTHORIZED", "Não autorizado", 401);
    }

    try {
        await queryDB(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE",
            [payload.id],
            env
        );
        return createResponse(c, { success: true });
    } catch (err) {
        throw err;
    }
};
