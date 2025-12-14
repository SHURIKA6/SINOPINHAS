import { queryDB } from '../db/index.js';
import { logAudit } from '../middleware/audit.js';

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
        return c.json({ error: "Erro ao registrar view" }, 500);
    }
};

export const postComment = async (c) => {
    const env = c.env;
    try {
        const { video_id, user_id, comment } = await c.req.json();

        if (!comment || !comment.trim()) {
            return c.json({ error: "Comentário vazio" }, 400);
        }

        await queryDB(
            "INSERT INTO comments (video_id, user_id, comment) VALUES ($1, $2, $3)",
            [video_id, user_id, comment],
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
        console.error("❌ Erro ao adicionar comentário:", err);
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
        console.error("❌ Erro ao buscar comentários:", err);
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
        return c.json({ error: "Erro ao listar usuários" }, 500);
    }
};

export const sendMessage = async (c) => {
    const env = c.env;
    try {
        const { from_id, to_id, msg } = await c.req.json();

        await queryDB(
            "INSERT INTO messages (from_id, to_id, msg) VALUES ($1, $2, $3)",
            [from_id, to_id, msg],
            env
        );

        console.log(`📨 Mensagem enviada: De User ${from_id} para User ${to_id}`);
        return c.json({ success: true });
    } catch (err) {
        console.error("❌ Erro ao enviar mensagem:", err);
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
        console.error("❌ Erro ao buscar mensagens:", err);
        return c.json({ error: "Erro ao buscar mensagens" }, 500);
    }
};

export const logTerms = async (c) => {
    try {
        const body = await c.req.json();
        await logAudit(null, "TERMS_ACCEPTED", body, c);
        return c.json({ success: true });
    } catch (err) {
        console.error("❌ Erro ao registrar termos:", err);
        return c.json({ error: "Erro ao registrar" }, 500);
    }
};
