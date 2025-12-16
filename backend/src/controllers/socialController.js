// --- Social Interactions (Likes, Views) ---
const videoId = c.req.param("id");
const env = c.env;
try {
    const { user_id } = await c.req.json();

    const { rows: existing } = await queryDB(
        "SELECT * FROM likes WHERE video_id = $1 AND user_id = $2",
        [videoId, user_id],
        env
    );

    if (existing.length > 0) {
        await queryDB("DELETE FROM likes WHERE video_id = $1 AND user_id = $2", [videoId, user_id], env);
    } else {
        await queryDB("INSERT INTO likes (video_id, user_id) VALUES ($1, $2)", [videoId, user_id], env);
    }

    return createResponse(c, { success: true });
} catch (err) {
    console.error("❌ Erro ao curtir vídeo:", err);
    throw err;
}
};

export const viewVideo = async (c) => {
    const videoId = c.req.param("id");
    const env = c.env;
    try {
        const { user_id } = await c.req.json();

        await queryDB("INSERT INTO views (video_id, user_id) VALUES ($1, $2)", [videoId, user_id], env);
        return createResponse(c, { success: true });
    } catch (err) {
        console.error("❌ Erro ao registrar view:", err);
        throw err;
    }
};

// --- Comments Section ---
export const postComment = async (c) => {
    const env = c.env;
    try {
        const { video_id, user_id, comment } = await c.req.json();

        // Prevent XSS
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
        }

        return createResponse(c, { success: true });
    } catch (err) {
        // Auto-Repair Table
        if (err.code === '42P01') {
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
            return createResponse(c, { success: true, repaired: true });
        }

        console.error("❌ Erro ao adicionar comentário:", err);
        throw err;
    }
};

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

        console.log(`✅ Listados ${rows.length} comentários do vídeo ${videoId}`);
        return createResponse(c, rows);
    } catch (err) {
        if (err.code === '42P01') return createResponse(c, []);

        console.error("❌ Erro ao buscar comentários:", err);
        throw err;
    }
};

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

        return c.json({ success: true });
    } catch (err) {
        console.error("❌ Erro ao deletar comentário:", err);
        throw err;
    }
};

// --- Notifications & Messaging ---
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

        return c.json(rows);
    } catch (err) {
        console.error("❌ Erro ao buscar notificações:", err);
        throw err;
    }
};

export const listAllUsers = async (c) => {
    const env = c.env;
    try {
        const { rows } = await queryDB(
            "SELECT id, username, avatar, bio FROM users ORDER BY username ASC",
            [],
            env
        );

        return c.json(rows);
    } catch (err) {
        console.error("❌ Erro ao listar usuários:", err);
        // Auto-recovery: Return empty list if something is wrong (e.g. missing column)
        return createResponse(c, []);
    }
};

export const sendMessage = async (c) => {
    const env = c.env;
    try {
        const { from_id, to_id, msg, admin_password, is_admin } = await c.req.json();
        const cleanMsg = sanitize(msg);

        let finalIsAdmin = false;
        if (is_admin && admin_password === env.ADMIN_PASSWORD) {
            finalIsAdmin = true;
        }

        await queryDB(
            "INSERT INTO messages (from_id, to_id, msg, is_admin) VALUES ($1, $2, $3, $4)",
            [from_id, to_id, cleanMsg, finalIsAdmin],
            env
        );

        return createResponse(c, { success: true });
    } catch (err) {
        // Auto-Repair: ensure messages table exists
        if (err.code === '42P01') {
            console.log("⚠️ Tabela 'messages' inexistente. Tentando criar...");
            await queryDB(`
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    from_id INTEGER NOT NULL,
                    to_id INTEGER NOT NULL,
                    msg TEXT NOT NULL,
                    is_admin BOOLEAN DEFAULT FALSE,
                    read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW()
                )
             `, [], env);
            // Retry? For now, let user retry.
            return createErrorResponse(c, "TABLE_CREATED", "Tabela criada. Tente novamente.", 500);
        }

        console.error("❌ Erro ao enviar mensagem:", err);
        throw err;
    }
};

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

        return c.json(rows);
    } catch (err) {
        // Auto-Recovery
        if (err.code === '42P01') {
            console.log("⚠️ Tabela 'messages' inexistente. Retornando vazio.");
            return createResponse(c, []);
        }
        console.error("❌ Erro ao buscar mensagens:", err);
        return createResponse(c, []); // Fail safe
    }
};

export const getAdminInbox = async (c) => {
    const env = c.env;
    try {
        // Auth handled by middleware

        const { rows } = await queryDB(
            `SELECT m.*, 
        uf.username as from_username, uf.avatar as from_avatar,
        ut.username as to_username, ut.avatar as to_avatar
       FROM messages m
       LEFT JOIN users uf ON m.from_id = uf.id
       LEFT JOIN users ut ON m.to_id = ut.id
       ORDER BY m.created_at DESC LIMIT 100`, /* Show last 100 messages for admin */
            [],
            env
        );

        return createResponse(c, rows);
    } catch (err) {
        console.error("❌ Erro ao buscar todas as mensagens:", err);
        return createResponse(c, []); // Fail safe
    }
};

export const logTerms = async (c) => {
    try {
        const body = await c.req.json();
        await logAudit(null, "TERMS_ACCEPTED", body, c);
        return createResponse(c, { success: true });
    } catch (err) {
        console.error("❌ Erro ao registrar termos:", err);
        throw err;
    }
};
