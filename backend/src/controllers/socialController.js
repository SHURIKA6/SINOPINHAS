import { queryDB } from '../db/index.js';
import { logAudit } from '../middleware/audit.js';
import { sanitize } from '../utils/sanitize.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';
import { notifyUser } from '../utils/push-utils.js';

// Curtir vídeo
export const likeVideo = async (c) => {
    const videoId = c.req.param("id");
    const env = c.env;
    let userId = null;

    try {
        const body = await c.req.json();
        userId = body.user_id;

        if (!userId) {
            return createErrorResponse(c, "REQUIRED_USER", "Identificação do usuário necessária", 400);
        }

        const { rows: existing } = await queryDB(
            "SELECT * FROM likes WHERE video_id = $1 AND user_id = $2",
            [videoId, userId],
            env
        );

        if (existing.length > 0) {
            await queryDB("DELETE FROM likes WHERE video_id = $1 AND user_id = $2", [videoId, userId], env);
        } else {
            await queryDB("INSERT INTO likes (video_id, user_id) VALUES ($1, $2)", [videoId, userId], env);
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

// Visualizar vídeo
export const viewVideo = async (c) => {
    const videoId = c.req.param("id");
    const env = c.env;
    let userId = null;

    try {
        const body = await c.req.json().catch(() => ({}));
        userId = body.user_id || null;

        await queryDB("INSERT INTO views (video_id, user_id) VALUES ($1, $2)", [videoId, userId], env);
        return createResponse(c, { success: true });
    } catch (err) {
        console.error("Error in viewVideo:", err.code, err.message);

        // Tabela não existe
        if (err.code === '42P01') {
            await queryDB(`
                CREATE TABLE IF NOT EXISTS views (
                    id SERIAL PRIMARY KEY,
                    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
                    user_id INTEGER,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `, [], env);

            await queryDB("INSERT INTO views (video_id, user_id) VALUES ($1, $2)", [videoId, userId], env);
            return createResponse(c, { success: true, repaired: true });
        }

        // Coluna 'user_id' não existe ou erro de Unique Constraint
        if (err.code === '42703' || err.code === '23505' || err.message.includes('user_id')) {
            try {
                // Remove restrição única se existir (caso tenha sido criada pelo schema.js antigo)
                await queryDB("ALTER TABLE views DROP CONSTRAINT IF EXISTS views_video_id_key", [], env);
                // Adiciona coluna user_id se faltar
                await queryDB("ALTER TABLE views ADD COLUMN IF NOT EXISTS user_id INTEGER", [], env);
                // Remove coluna views se existir (limpeza)
                await queryDB("ALTER TABLE views DROP COLUMN IF EXISTS views", [], env);

                await queryDB("INSERT INTO views (video_id, user_id) VALUES ($1, $2)", [videoId, userId], env);
                return createResponse(c, { success: true, repaired_schema: true });
            } catch (repairErr) {
                console.error("Failed to repair views table:", repairErr);
            }
        }

        // Se falhar tudo, pelo menos não crasha o app
        return createResponse(c, { success: false, error: err.message }, 500);
    }
};

// Postar comentário
export const postComment = async (c) => {
    const env = c.env;
    try {
        const { video_id, user_id, comment } = await c.req.json();
        const cleanComment = sanitize(comment);

        if (!cleanComment || !cleanComment.trim()) {
            return createErrorResponse(c, "INVALID_INPUT", "Comentário vazio", 400);
        }

        await queryDB(
            "INSERT INTO comments (video_id, user_id, comment) VALUES ($1, $2, $3)",
            [video_id, user_id, cleanComment],
            env
        );

        const { rows: video } = await queryDB("SELECT user_id FROM videos WHERE id = $1", [video_id], env);

        if (video.length > 0 && video[0].user_id !== user_id) {
            await queryDB(
                "INSERT INTO notifications (user_id, type, related_id, message) VALUES ($1, $2, $3, $4)",
                [video[0].user_id, "comment", video_id, "Novo comentário no seu vídeo"],
                env
            );

            // Notificação Push em Segundo Plano
            c.executionCtx.waitUntil(notifyUser(
                video[0].user_id,
                "Novo Comentário! 💬",
                "Alguém comentou no seu vídeo no SINOPINHAS.",
                env
            ));
        }

        return createResponse(c, { success: true });
    } catch (err) {
        if (err.code === '42P01') {
            const table = err.message.includes('comments') ? 'comments' : 'notifications';
            if (table === 'comments') {
                await queryDB(`
                    CREATE TABLE IF NOT EXISTS comments (
                        id SERIAL PRIMARY KEY,
                        video_id INTEGER NOT NULL,
                        user_id INTEGER NOT NULL,
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

// Buscar comentários
export const getComments = async (c) => {
    const videoId = c.req.param("videoId");
    const env = c.env;
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
        if (err.code === '42P01') return createResponse(c, []);
        throw err;
    }
};

// Deletar comentário
export const deleteComment = async (c) => {
    const commentId = c.req.param("id");
    const env = c.env;
    try {
        const { user_id, admin_password } = await c.req.json();
        const isAdmin = admin_password === env.ADMIN_PASSWORD;

        if (!isAdmin) {
            const { rows } = await queryDB("SELECT user_id FROM comments WHERE id = $1", [commentId], env);
            if (rows.length === 0 || rows[0].user_id !== user_id) {
                return createErrorResponse(c, "FORBIDDEN", "Não autorizado", 403);
            }
        }

        await queryDB("DELETE FROM comments WHERE id = $1", [commentId], env);
        return createResponse(c, { success: true });
    } catch (err) {
        throw err;
    }
};

// Buscar notificações
export const getNotifications = async (c) => {
    const userId = c.req.param("userId");
    const env = c.env;
    if (!userId) return createErrorResponse(c, "INVALID_PARAM", "Parâmetro 'userId' inválido", 400);

    try {
        const { rows } = await queryDB(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            [userId],
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

// Listar usuários
export const listAllUsers = async (c) => {
    const env = c.env;
    try {
        const { rows } = await queryDB(
            "SELECT id, username, avatar, bio FROM users ORDER BY username ASC",
            [],
            env
        );
        return createResponse(c, rows);
    } catch (err) {
        return createResponse(c, []);
    }
};

// Enviar mensagem
export const sendMessage = async (c) => {
    const env = c.env;
    let body;
    try {
        body = await c.req.json();
    } catch (e) {
        return createErrorResponse(c, "INVALID_JSON", "Corpo da requisição inválido", 400);
    }

    const { from_id, to_id, msg, admin_password, is_admin } = body;
    const cleanMsg = sanitize(msg);
    const finalIsAdmin = !!(is_admin && admin_password === env.ADMIN_PASSWORD);

    // Garantir que IDs sejam números para o Postgres e evitar NaN
    const fId = parseInt(from_id);
    const tId = parseInt(to_id);

    if (isNaN(fId) || isNaN(tId)) {
        return createErrorResponse(c, "INVALID_PARAM", `IDs inválidos: from=${from_id}, to=${to_id}`, 400);
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

// Marcar como lido
export const markAsRead = async (c) => {
    const fromId = c.req.param("id");
    const env = c.env;
    try {
        const body = await c.req.json();
        const userId = body.userId;

        if (!userId) {
            return createErrorResponse(c, "INVALID_PARAM", "userId não fornecido no corpo da requisição", 400);
        }

        await queryDB(
            "UPDATE messages SET is_read = TRUE WHERE from_id = $1 AND to_id = $2 AND is_read = FALSE",
            [fromId, userId],
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

// Buscar mensagens (Privado)
export const getInbox = async (c) => {
    const userId = c.req.param("userId");
    const env = c.env;
    if (!userId) return createErrorResponse(c, "INVALID_PARAM", "Parâmetro 'userId' inválido", 400);

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
            [userId],
            env
        );
        return createResponse(c, rows);
    } catch (err) {
        if (err.code === '42P01') return createResponse(c, []);
        return createResponse(c, []);
    }
};

// Buscar todas as mensagens (Admin)
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

// Criar chamado de suporte
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

// Log de termos
export const logTerms = async (c) => {
    try {
        const body = await c.req.json();
        await logAudit(null, "TERMS_ACCEPTED", body, c);
        return createResponse(c, { success: true });
    } catch (err) {
        throw err;
    }
};
