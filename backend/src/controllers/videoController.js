import { queryDB } from '../db/index.js';
import { logAudit } from '../middleware/audit.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';
import { videoMetadataSchema } from '../schemas/video.js';

// --- Upload e Gerenciamento de Vídeos ---
export const uploadVideo = async (c) => {
    const env = c.env;
    try {
        console.log("📤 Iniciando upload para Cloudflare R2...");

        const formData = await c.req.formData();
        const file = formData.get("file");
        const validationResult = videoMetadataSchema.safeParse({
            title: formData.get("title"),
            description: formData.get("description"),
            is_restricted: formData.get("is_restricted"),
            type: formData.get("type") || (file.type.startsWith("image/") ? "photo" : "video")
        });

        if (!validationResult.success) {
            const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
            console.log(`❌ input inválido: ${errors}`);
            return createErrorResponse(c, "INVALID_INPUT", errors, 400);
        }

        const { title, description, is_restricted: isRestricted, type } = validationResult.data;
        const userId = formData.get("user_id");

        if (!file || !userId) {
            return createErrorResponse(c, "INVALID_INPUT", "Arquivo e ID de usuário são obrigatórios", 400);
        }

        // Generate unique filename (simple random string + timestamp)
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const extension = file.name.split('.').pop();
        const r2Key = `${timestamp}-${randomStr}.${extension}`;

        console.log(`📤 Upload: "${title}" (${file.size} bytes) [${type}] -> R2 Key: ${r2Key}`);

        // Upload to R2 (Direct Binding)
        await env.VIDEO_BUCKET.put(r2Key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
        });

        console.log(`✅ Upload no R2 concluído!`);

        // Save metadata to DB (using bunny_id column to store R2 Key)
        await queryDB(
            "INSERT INTO videos (title, description, bunny_id, user_id, is_restricted, type) VALUES ($1, $2, $3, $4, $5, $6)",
            [title, description, r2Key, userId, isRestricted, type],
            env
        );

        await logAudit(userId, "VIDEO_UPLOADED_R2", { title, r2_key: r2Key, is_restricted: isRestricted }, c);
        console.log(`✅ Detalhes salvos no banco!`);

        // CACHE INVALIDATION
        // CACHE INVALIDATION
        c.executionCtx.waitUntil(Promise.all([
            env.MURAL_STORE.delete('videos_public'),
            env.MURAL_STORE.delete('videos_secret')
        ]));

        return createResponse(c, { success: true, bunny_id: r2Key });
    } catch (err) {
        console.error("❌ ERRO NO UPLOAD:", err);
        throw err;
    }
};

// --- Listagem de Vídeos (Públicos) ---
export const listVideos = async (c) => {
    const env = c.env;
    const userId = c.req.query("user_id");

    // CACHE - Only cache the public feed (no user_id filter)
    if (!userId) {
        try {
            const cached = await env.MURAL_STORE.get('videos_public', { type: 'json' });
            if (cached) {
                console.log("⚡ Servindo do Cache KV");
                return createResponse(c, cached);
            }
        } catch (e) {
            console.warn("⚠️ Falha ao ler cache:", e);
        }
    }

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

        // CACHE - Save only public feed for 60 seconds
        if (!userId) {
            c.executionCtx.waitUntil(
                env.MURAL_STORE.put('videos_public', JSON.stringify(videosWithUrl), { expirationTtl: 60 })
            );
        }

        console.log(`✅ Listados ${rows.length} vídeos públicos`);
        return createResponse(c, videosWithUrl);
    } catch (err) {
        console.error("❌ Erro ao buscar vídeos:", err);
        throw err;
    }
};

// --- Vídeos Secretos (Privados) ---
export const listSecretVideos = async (c) => {
    const env = c.env;
    const userId = c.req.query("user_id");

    // CACHE - Only cache the global secret feed (no user_id filter)
    if (!userId) {
        try {
            const cached = await env.MURAL_STORE.get('videos_secret', { type: 'json' });
            if (cached) {
                console.log("⚡ Servindo Secret Feed do Cache KV");
                return createResponse(c, cached);
            }
        } catch (e) {
            console.warn("⚠️ Falha ao ler cache:", e);
        }
    }

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

        // CACHE - Save secret feed for 60 seconds
        if (!userId) {
            c.executionCtx.waitUntil(
                env.MURAL_STORE.put('videos_secret', JSON.stringify(videosWithUrl), { expirationTtl: 60 })
            );
        }

        console.log(`✅ Listados ${rows.length} vídeos restritos`);
        return createResponse(c, videosWithUrl);
    } catch (err) {
        console.error("❌ Erro ao buscar vídeos restritos:", err);
        throw err;
    }
};

// --- Exclusão de Vídeos ---
export const deleteVideo = async (c) => {
    // --- Secure Delete Logic (Updated) ---
    const videoId = c.req.param("id");
    const env = c.env;
    const payload = c.get('jwtPayload'); // Trust the Token

    // 1. Validate AuthN
    if (!payload?.id && payload?.role !== 'admin') {
        return createErrorResponse(c, "UNAUTHORIZED", "Login required", 401);
    }
    try {
        // 2. Fetch Metadata
        const { rows } = await queryDB("SELECT user_id, bunny_id FROM videos WHERE id = $1", [videoId], env);

        // 3. Resource Not Found Logic
        if (rows.length === 0) {
            // Standard 404 if it truly doesn't exist
            return createErrorResponse(c, "NOT_FOUND", "Video not found", 404);
        }

        const video = rows[0];
        const requesterId = payload.id;
        const isAdmin = payload.role === 'admin';
        const isOwner = String(video.user_id) === String(requesterId);

        // 4. Authorization Guard (Secure 404)
        if (!isAdmin && !isOwner) {
            // Return 404 to prevent ID enumeration (Security by Obscurity for private resources)
            // returning 403 leaks that ID "9" exists but is forbidden. 404 says "I don't know what you are talking about".
            console.warn(`[Security] User ${requesterId} tried to delete video ${videoId} (owned by ${video.user_id}). Returned 404.`);
            return createErrorResponse(c, "NOT_FOUND", "Video not found", 404);
        }

        // 5. Execution (Storage + DB)
        // Delete from R2 (Safe delete)
        if (video.bunny_id) {
            try {
                console.log(`🗑️ Deletando do R2: ${video.bunny_id}`);
                await env.VIDEO_BUCKET.delete(video.bunny_id);
            } catch (storageErr) {
                console.warn(`⚠️ Falha Storage: ${storageErr.message}`);
            }
        }

        // Delete from DB
        await queryDB("DELETE FROM videos WHERE id = $1", [videoId], env);
        await logAudit(requesterId, "VIDEO_DELETED", { video_id: videoId, is_admin: isAdmin }, c);

        console.log(`✅ Vídeo removido: ${videoId}`);

        // CACHE INVALIDATION
        c.executionCtx.waitUntil(Promise.all([
            env.MURAL_STORE.delete('videos_public'),
            env.MURAL_STORE.delete('videos_secret')
        ]));

        return createResponse(c, { success: true });
    } catch (err) {
        console.error("❌ Erro ao deletar vídeo:", err);
        throw err;
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
            return createErrorResponse(c, "NOT_FOUND", "Vídeo não encontrado", 404);
        }

        const video = rows[0];
        const videoWithUrl = {
            ...video,
            video_url: video.bunny_id ? `${env.R2_PUBLIC_DOMAIN}/${video.bunny_id}` : null
        };

        return createResponse(c, videoWithUrl);
    } catch (err) {
        console.error("❌ Erro ao buscar vídeo:", err);
        throw err;
    }
};

// --- Busca de Vídeos ---
export const searchVideos = async (c) => {
    const env = c.env;
    const query = c.req.query("q");
    try {
        if (!query) return createResponse(c, []);

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
        return createResponse(c, videosWithUrl);
    } catch (err) {
        console.error("❌ Erro na busca:", err);
        throw err;
    }
};
