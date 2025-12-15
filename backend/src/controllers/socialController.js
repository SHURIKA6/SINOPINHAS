import { queryDB } from '../db/index.js';
import { logAudit } from '../middleware/audit.js';
// Forced Deployment Trigger: 2025-12-15 v2
import { sanitize } from '../utils/sanitize.js';

export const likeVideo = async (c) => {
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
            console.log(`💔 Like removido: Vídeo ${videoId} por User ${user_id}`);
        } else {
            await queryDB("INSERT INTO likes (video_id, user_id) VALUES ($1, $2)", [videoId, user_id], env);
            console.log(`❤️ Like adicionado: Vídeo ${videoId} por User ${user_id}`);
        }

        return c.json({ success: true });
    } catch (err) {
        console.error("❌ Erro ao curtir vídeo:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json({ error: "Erro ao curtir vídeo" }, 500);
    }
};

export const viewVideo = async (c) => {
    const videoId = c.req.param("id");
    const env = c.env;
    try {
        const { user_id } = await c.req.json();

        await queryDB("INSERT INTO views (video_id, user_id) VALUES ($1, $2)", [videoId, user_id], env);

        console.log(`👁️ View registrada: Vídeo ${videoId} por User ${user_id}`);
        return c.json({ success: true });
    } catch (err) {
        console.error("❌ Erro ao registrar view:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json({ error: "Erro ao registrar view" }, 500);
    }
};

export const postComment = async (c) => {
    const env = c.env;
    try {
        const { video_id, user_id, comment } = await c.req.json();

        // Prevent XSS
        const cleanComment = sanitize(comment);

        if (!cleanComment || !cleanComment.trim()) {
            return c.json({ error: "Comentário vazio" }, 400);
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

        console.log(`💬 Comentário adicionado: Vídeo ${video_id} por User ${user_id}`);
        return c.json({ success: true });
    } catch (err) {
        // AUTO-REPAIR: If table missing (42P01), create it and retry
        if (err.code === '42P01') {
            console.log("⚠️ Tabela 'comments' inexistente. Criando automaticamente...");
            await queryDB(`
                CREATE TABLE IF NOT EXISTS comments (
                    id SERIAL PRIMARY KEY,
                    video_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    comment TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `, [], env);
            // Retry the insert
            await queryDB(
                "INSERT INTO comments (video_id, user_id, comment) VALUES ($1, $2, $3)",
                [video_id, user_id, sanitize(comment)],
                env
            );
            // Notifications table might also be missing, handle separately or assume subsequent calls fix it
            // For simplicity, we just retry the main partial
            return c.json({ success: true, repaired: true });
        }

        console.error("❌ Erro ao adicionar comentário:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json({ error: "Erro ao adicionar comentário" }, 500);
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
        return c.json(rows);
    } catch (err) {
        // Graceful handling for missing table
        if (err.code === '42P01') {
            console.log("⚠️ Tabela 'comments' inexistente. Retornando lista vazia.");
            return c.json([]);
        }

        console.error("❌ Erro ao buscar comentários:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json({ error: "Erro ao buscar comentários" }, 500);
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
                return c.json({ error: "Não autorizado" }, 403);
            }
        }

        await queryDB("DELETE FROM comments WHERE id = $1", [commentId], env);
        console.log(`✅ Comentário deletado: ID ${commentId}`);

        return c.json({ success: true });
    } catch (err) {
        console.error("❌ Erro ao deletar comentário:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json({ error: "Erro ao deletar comentário" }, 500);
    }
};

export const getNotifications = async (c) => {
    const userId = c.req.param("userId");
    const env = c.env;
    try {
        const { rows } = await queryDB(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            [userId],
            env
        );

        console.log(`✅ Listadas ${rows.length} notificações do User ${userId}`);
        return c.json(rows);
    } catch (err) {
        console.error("❌ Erro ao buscar notificações:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json({ error: "Erro ao buscar notificações" }, 500);
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

        console.log(`✅ Listados ${rows.length} usuários`);
        return c.json(rows);
    } catch (err) {
        console.error("❌ Erro ao listar usuários:", err);
        // Auto-recovery: Return empty list if something is wrong (e.g. missing column)
        return c.json([]);
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

        console.log(`📨 Mensagem enviada: De User ${from_id} para User ${to_id} (Admin: ${finalIsAdmin})`);
        return c.json({ success: true });
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
            return c.json({ error: "Tabela criada. Tente novamente." }, 500);
        }

        console.error("❌ Erro ao enviar mensagem:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json({ error: "Erro ao enviar mensagem" }, 500);
    }
};

export const getInbox = async (c) => {
    const userId = c.req.param("userId");
    const env = c.env;
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

        console.log(`✅ Listadas ${rows.length} mensagens do User ${userId}`);
        return c.json(rows);
    } catch (err) {
        // Auto-Recovery
        if (err.code === '42P01') {
            console.log("⚠️ Tabela 'messages' inexistente. Retornando vazio.");
            return c.json([]);
        }
        console.error("❌ Erro ao buscar mensagens:", err);
        return c.json([]); // Fail safe
    }
};

export const getAdminInbox = async (c) => {
    const env = c.env;
    try {
        const adminPass = c.req.query("admin_password");

        if (adminPass !== env.ADMIN_PASSWORD) {
            return c.json({ error: "Não autorizado" }, 403);
        }

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

        console.log(`✅ [ADMIN] Listadas ${rows.length} mensagens globais`);
        return c.json(rows);
    } catch (err) {
        console.error("❌ Erro ao buscar todas as mensagens:", err);
        return c.json([]); // Fail safe
    }
};

export const logTerms = async (c) => {
    try {
        const body = await c.req.json();
        await logAudit(null, "TERMS_ACCEPTED", body, c);
        return c.json({ success: true });
    } catch (err) {
        console.error("❌ Erro ao registrar termos:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json({ error: "Erro ao registrar" }, 500);
    }
};
