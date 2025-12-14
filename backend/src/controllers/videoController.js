import { queryDB } from '../db/index.js';
import { logAudit } from '../middleware/audit.js';

export const uploadVideo = async (c) => {
    const env = c.env;
    try {
        console.log("📤 Iniciando upload para Bunny CDN...");

        const formData = await c.req.formData();
        const file = formData.get("file");
        const title = formData.get("title");
        const userId = formData.get("user_id");
        const isRestricted = formData.get("is_restricted") === "true";

        if (!file || !title || !userId) {
            console.log("❌ Faltam dados obrigatórios");
            return c.json({ error: "Faltam dados obrigatórios" }, 400);
        }

        console.log(`📤 Upload: "${title}" (${file.size} bytes)`);
        console.log(`🔑 API Key (8 primeiros): ${env.BUNNY_API_KEY?.substring(0, 8)}`);
        console.log(`📚 BUNNY_LIBRARY_ID: ${env.BUNNY_LIBRARY_ID}`);

        const createVideoRes = await fetch(
            `https://video.bunnycdn.com/library/${env.BUNNY_LIBRARY_ID}/videos`,
            {
                method: "POST",
                headers: {
                    AccessKey: env.BUNNY_API_KEY,
                    Authorization: `Bearer ${env.BUNNY_API_KEY}`,
                    accept: "application/json",
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    title: title,
                }),
            }
        );

        const responseText = await createVideoRes.text();
        console.log(`📡 Resposta Bunny (${createVideoRes.status}):`, responseText.substring(0, 200));

        if (!createVideoRes.ok) {
            throw new Error(`Bunny retornou ${createVideoRes.status}: ${responseText}`);
        }

        const videoData = JSON.parse(responseText);
        const videoGuid = videoData.guid;
        console.log(`✅ Vídeo criado: ${videoGuid}`);

        const buffer = await file.arrayBuffer();
        const uploadRes = await fetch(
            `https://video.bunnycdn.com/library/${env.BUNNY_LIBRARY_ID}/videos/${videoGuid}`,
            {
                method: "PUT",
                headers: {
                    AccessKey: env.BUNNY_API_KEY,
                },
                body: buffer,
            }
        );

        console.log(`📡 Upload status: ${uploadRes.status}`);

        if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            throw new Error(`Falha no upload: ${errorText}`);
        }

        await queryDB(
            "INSERT INTO videos (title, bunny_id, user_id, is_restricted) VALUES ($1, $2, $3, $4)",
            [title, videoGuid, userId, isRestricted],
            env
        );

        await logAudit(userId, "VIDEO_UPLOADED", { title, is_restricted: isRestricted }, c);
        console.log(`✅ SUCESSO TOTAL!`);

        return c.json({ success: true, bunny_id: videoGuid });
    } catch (err) {
        console.error("❌ ERRO:", err.message);
        console.error("Stack:", err.stack);
        return c.json(
            {
                error: "Erro ao fazer upload",
                details: err.message,
            },
            500
        );
    }
};

export const listVideos = async (c) => {
    const env = c.env;
    const userId = c.req.query("user_id");
    try {
        let query = `
      SELECT v.*, u.username,
      (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
      (SELECT COUNT(*) FROM views WHERE video_id = v.id) as views
    `;

        if (userId) {
            query += `, EXISTS(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = $1) as user_liked`;
        }

        query += `
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.is_restricted = false
      ORDER BY v.created_at DESC
    `;

        const { rows } = await queryDB(query, userId ? [userId] : [], env);

        console.log(`✅ Listados ${rows.length} vídeos públicos`);
        return c.json(rows);
    } catch (err) {
        console.error("❌ Erro ao buscar vídeos:", err);
        return c.json({ error: "Erro ao buscar vídeos" }, 500);
    }
};

export const listSecretVideos = async (c) => {
    const env = c.env;
    const userId = c.req.query("user_id");
    try {
        let query = `
      SELECT v.*, u.username,
      (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
      (SELECT COUNT(*) FROM views WHERE video_id = v.id) as views
    `;

        if (userId) {
            query += `, EXISTS(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = $1) as user_liked`;
        }

        query += `
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.is_restricted = true
      ORDER BY v.created_at DESC
    `;

        const { rows } = await queryDB(query, userId ? [userId] : [], env);

        console.log(`✅ Listados ${rows.length} vídeos restritos`);
        return c.json(rows);
    } catch (err) {
        console.error("❌ Erro ao buscar vídeos restritos:", err);
        return c.json({ error: "Erro ao buscar vídeos" }, 500);
    }
};

export const deleteVideo = async (c) => {
    const videoId = c.req.param("id");
    const env = c.env;
    try {
        const { userId, adminPassword } = await c.req.json();
        const isAdmin = adminPassword === env.ADMIN_PASSWORD;

        if (!isAdmin && !userId) {
            return c.json({ error: "Não autorizado" }, 403);
        }

        if (!isAdmin) {
            const { rows } = await queryDB("SELECT user_id FROM videos WHERE id = $1", [videoId], env);

            if (rows.length === 0) {
                return c.json({ error: "Vídeo não encontrado" }, 404);
            }

            if (rows[0].user_id.toString() !== userId.toString()) {
                return c.json({ error: "Não autorizado" }, 403);
            }
        }

        await queryDB("DELETE FROM videos WHERE id = $1", [videoId], env);
        await logAudit(userId || null, "VIDEO_DELETED", { video_id: videoId, is_admin: isAdmin }, c);
        console.log(`✅ Vídeo deletado: ID ${videoId}`);

        return c.json({ success: true });
    } catch (err) {
        console.error("❌ Erro ao deletar vídeo:", err);
        return c.json({ error: "Erro ao deletar vídeo" }, 500);
    }
};
