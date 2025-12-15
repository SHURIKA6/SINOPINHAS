import { queryDB } from '../db/index.js';
import { logAudit } from '../middleware/audit.js';

export const uploadVideo = async (c) => {
    const env = c.env;
    try {
        console.log("📤 Iniciando upload para Cloudflare R2...");

        const formData = await c.req.formData();
        const file = formData.get("file");
        const title = formData.get("title");
        const description = formData.get("description") || "";
        const userId = formData.get("user_id");
        const isRestricted = formData.get("is_restricted") === "true";

        if (!file || !title || !userId) {
            console.log("❌ Faltam dados obrigatórios");
            return c.json({ error: "Faltam dados obrigatórios" }, 400);
        }

        // Generate unique filename (simple random string + timestamp)
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const extension = file.name.split('.').pop();
        const r2Key = `${timestamp}-${randomStr}.${extension}`;

        console.log(`📤 Upload: "${title}" (${file.size} bytes) -> R2 Key: ${r2Key}`);

        // Upload to R2 (Direct Binding)
        await env.VIDEO_BUCKET.put(r2Key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
        });

        console.log(`✅ Upload no R2 concluído!`);

        // Save metadata to DB (using bunny_id column to store R2 Key)
        await queryDB(
            "INSERT INTO videos (title, description, bunny_id, user_id, is_restricted) VALUES ($1, $2, $3, $4, $5)",
            [title, description, r2Key, userId, isRestricted],
            env
        );

        await logAudit(userId, "VIDEO_UPLOADED_R2", { title, r2_key: r2Key, is_restricted: isRestricted }, c);
        console.log(`✅ Detalhes salvos no banco!`);

        return c.json({ success: true, bunny_id: r2Key });
    } catch (err) {
        console.error("❌ ERRO NO UPLOAD:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json(
            {
                error: "Erro ao fazer upload para R2",
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

        // Inject R2 URL
        const videosWithUrl = rows.map(v => ({
            ...v,
            video_url: v.bunny_id ? `${env.R2_PUBLIC_DOMAIN}/${v.bunny_id}` : null
        }));

        console.log(`✅ Listados ${rows.length} vídeos públicos`);
        return c.json(videosWithUrl);
    } catch (err) {
        console.error("❌ Erro ao buscar vídeos:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

        // Inject R2 URL
        const videosWithUrl = rows.map(v => ({
            ...v,
            video_url: v.bunny_id ? `${env.R2_PUBLIC_DOMAIN}/${v.bunny_id}` : null
        }));

        console.log(`✅ Listados ${rows.length} vídeos restritos`);
        return c.json(videosWithUrl);
    } catch (err) {
        console.error("❌ Erro ao buscar vídeos restritos:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

        // Get video details to find the R2 Key
        const { rows } = await queryDB("SELECT user_id, bunny_id FROM videos WHERE id = $1", [videoId], env);

        if (rows.length === 0) {
            return c.json({ error: "Vídeo não encontrado" }, 404);
        }

        const video = rows[0];

        // Authorization Check
        if (!isAdmin) {
            if (video.user_id.toString() !== userId.toString()) {
                return c.json({ error: "Não autorizado" }, 403);
            }
        }

        // Delete from R2
        if (video.bunny_id) {
            console.log(`🗑️ Deletando do R2: ${video.bunny_id}`);
            await env.VIDEO_BUCKET.delete(video.bunny_id);
        }

        // Delete from DB
        await queryDB("DELETE FROM videos WHERE id = $1", [videoId], env);
        await logAudit(userId || null, "VIDEO_DELETED_R2", { video_id: videoId, is_admin: isAdmin }, c);
        console.log(`✅ Vídeo deletado do DB: ID ${videoId}`);

        return c.json({ success: true });
    } catch (err) {
        console.error("❌ Erro ao deletar vídeo:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json({ error: "Erro ao deletar vídeo R2" }, 500);
    }
};

export const getVideo = async (c) => {
    const videoId = c.req.param("id");
    const env = c.env;
    try {
        const { rows } = await queryDB(
            `SELECT v.*, u.username,
       (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
       (SELECT COUNT(*) FROM views WHERE video_id = v.id) as views
       FROM videos v
       LEFT JOIN users u ON v.user_id = u.id
       WHERE v.id = $1`,
            [videoId],
            env
        );

        if (rows.length === 0) {
            return c.json({ error: "Vídeo não encontrado" }, 404);
        }

        const video = rows[0];
        const videoWithUrl = {
            ...video,
            video_url: video.bunny_id ? `${env.R2_PUBLIC_DOMAIN}/${video.bunny_id}` : null
        };

        return c.json(videoWithUrl);
    } catch (err) {
        console.error("❌ Erro ao buscar vídeo:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json({ error: "Erro ao buscar vídeo" }, 500);
    }
};

export const searchVideos = async (c) => {
    const env = c.env;
    const query = c.req.query("q");
    try {
        if (!query) return c.json([]);

        const { rows } = await queryDB(
            `SELECT v.*, u.username,
       (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
       (SELECT COUNT(*) FROM views WHERE video_id = v.id) as views
       FROM videos v
       LEFT JOIN users u ON v.user_id = u.id
       WHERE v.is_restricted = false 
       AND (v.title ILIKE $1 OR v.description ILIKE $1)
       ORDER BY v.created_at DESC LIMIT 50`,
            [`%${query}%`],
            env
        );

        // Inject R2 URL
        const videosWithUrl = rows.map(v => ({
            ...v,
            video_url: v.bunny_id ? `${env.R2_PUBLIC_DOMAIN}/${v.bunny_id}` : null
        }));

        console.log(`🔍 Busca por "${query}": ${rows.length} resultados`);
        return c.json(videosWithUrl);
    } catch (err) {
        console.error("❌ Erro na busca:", err);
        return c.json({ error: "Erro ao buscar" }, 500);
    }
};
