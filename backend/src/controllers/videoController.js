import { queryDB } from '../db/index.js';
import { logAudit } from '../middleware/audit.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';
import { videoMetadataSchema } from '../schemas/video.js';
import { sanitize } from '../utils/sanitize.js';

// Tipos MIME permitidos para upload
const ALLOWED_MIME_TYPES = [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Função: Upload de vídeo para Cloudflare R2
export const uploadVideo = async (c) => {
    const env = c.env;
    try {
        const formData = await c.req.formData();
        const file = formData.get("file");

        // Segurança: Usar JWT payload — NUNCA confiar no formData.user_id
        const payload = c.get('jwtPayload');
        const userId = payload?.id;

        if (!file || !userId) {
            return createErrorResponse(c, "INVALID_INPUT", "Arquivo e autenticação são obrigatórios", 400);
        }

        // Validação de tipo de arquivo
        if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
            return createErrorResponse(c, "INVALID_FILE_TYPE",
                `Tipo de arquivo não permitido: ${file.type}. Use: MP4, WebM, JPEG, PNG, GIF, WebP`, 400);
        }

        // Validação de tamanho
        if (file.size && file.size > MAX_FILE_SIZE) {
            return createErrorResponse(c, "FILE_TOO_LARGE",
                `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 50MB`, 400);
        }

        const validationResult = videoMetadataSchema.safeParse({
            title: formData.get("title"),
            description: formData.get("description"),
            is_restricted: formData.get("is_restricted"),
            type: formData.get("type") || (file.type.startsWith("image/") ? "photo" : "video")
        });

        if (!validationResult.success) {
            const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
            return createErrorResponse(c, "INVALID_INPUT", errors, 400);
        }

        const { title, description, is_restricted: isRestricted, type } = validationResult.data;

        // Sanitizar título e descrição contra XSS
        const cleanTitle = sanitize(title);
        const cleanDescription = description ? sanitize(description) : null;

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const fileName = (typeof file === 'string') ? 'file' : file.name || 'file';
        const extension = fileName.split('.').pop();
        const r2Key = `${timestamp}-${randomStr}.${extension}`;

        const blob = (typeof file === 'string') ? null : file;

        if (type === 'photo') {
            await env.VIDEO_BUCKET.put(r2Key, blob.stream(), {
                httpMetadata: {
                    contentType: blob.type,
                    cacheControl: 'public, max-age=604800, immutable'
                },
            });
        } else {
            await env.VIDEO_BUCKET.put(r2Key, blob.stream(), {
                httpMetadata: {
                    contentType: blob.type,
                },
            });
        }

        await queryDB(
            "INSERT INTO videos (title, description, bunny_id, user_id, is_restricted, type) VALUES ($1, $2, $3, $4, $5, $6)",
            [cleanTitle, cleanDescription, r2Key, userId, isRestricted, type],
            env
        );

        await logAudit(userId, "VIDEO_UPLOADED_R2", { title, r2_key: r2Key, is_restricted: isRestricted }, c);

        c.executionCtx.waitUntil(Promise.all([
            env.MURAL_STORE.delete('videos_public_all'),
            env.MURAL_STORE.delete('videos_public_photo'),
            env.MURAL_STORE.delete('videos_public_video'),
            env.MURAL_STORE.delete('videos_secret_all'),
            env.MURAL_STORE.delete('videos_secret_photo'),
            env.MURAL_STORE.delete('videos_secret_video')
        ]));

        return createResponse(c, { success: true, bunny_id: r2Key });
    } catch (err) {
        console.error("Upload error:", err);
        throw err;
    }
};

// Função: Deletar vídeo e remover do armazenamento
export const deleteVideo = async (c) => {
    const videoId = c.req.param("id");
    const env = c.env;
    const payload = c.get('jwtPayload');

    if (payload?.id === undefined || payload?.id === null) {
        return createErrorResponse(c, "UNAUTHORIZED", "Login required", 401);
    }
    try {
        const { rows } = await queryDB("SELECT user_id, bunny_id FROM videos WHERE id = $1", [videoId], env);

        if (rows.length === 0) {
            return createErrorResponse(c, "NOT_FOUND", "Video not found", 404);
        }

        const video = rows[0];
        const requesterId = payload.id;
        const isAdmin = payload.role === 'admin';
        const isOwner = String(video.user_id) === String(requesterId);

        if (!isAdmin && !isOwner) {
            return createErrorResponse(c, "NOT_FOUND", "Video not found", 404);
        }

        if (video.bunny_id) {
            try {
                await env.VIDEO_BUCKET.delete(video.bunny_id);
            } catch (storageErr) { }
        }

        await queryDB("DELETE FROM videos WHERE id = $1", [videoId], env);
        await logAudit(requesterId, "VIDEO_DELETED", { video_id: videoId, is_admin: isAdmin }, c);

        c.executionCtx.waitUntil(Promise.all([
            env.MURAL_STORE.delete('videos_public_all'),
            env.MURAL_STORE.delete('videos_public_photo'),
            env.MURAL_STORE.delete('videos_public_video'),
            env.MURAL_STORE.delete('videos_secret_all'),
            env.MURAL_STORE.delete('videos_secret_photo'),
            env.MURAL_STORE.delete('videos_secret_video')
        ]));

        return createResponse(c, { success: true });
    } catch (err) {
        throw err;
    }
};

// Função: Listar vídeos públicos com filtros
export const listVideos = async (c) => {
    const env = c.env;
    const userId = c.req.query("user_id");
    const limit = parseInt(c.req.query("limit") || "12");
    const offset = parseInt(c.req.query("offset") || "0");
    const type = c.req.query("type"); // New: Filter by 'video' or 'photo'
    const authorId = c.req.query("author_id"); // New: Filter by video creator

    const cacheKey = `videos_public_${type || 'all'}_${authorId || 'global'}`;

    // Cache: Apenas na primeira página global
    if (!userId && !authorId && offset === 0 && limit === 12) {
        try {
            const cached = await env.MURAL_STORE.get(cacheKey, { type: 'json' });
            if (cached) {
                c.header('Cache-Control', 'public, max-age=30');
                return createResponse(c, cached);
            }
        } catch (e) { }
    }

    try {
        let sql = `
          SELECT v.*, u.username,
          (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
          (SELECT COUNT(*) FROM views WHERE video_id = v.id) as views,
          (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments_count
        `;

        const params = [];
        let paramCount = 1;

        if (userId) {
            sql += `, EXISTS(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = $${paramCount++}) as user_liked`;
            params.push(userId);
        }

        sql += `
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.is_restricted = false
    `;

        if (authorId) {
            sql += ` AND v.user_id = $${paramCount++}`;
            params.push(authorId);
        }

        if (type === 'photo') {
            sql += ` AND v.type = 'photo'`;
        } else if (type === 'video') {
            sql += ` AND (v.type = 'video' OR v.type IS NULL)`;
        }

        sql += `
      ORDER BY v.created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
        params.push(limit, offset);

        const { rows } = await queryDB(sql, params, env);

        const videosWithUrl = rows.map(v => ({
            ...v,
            video_url: v.bunny_id ? `${env.R2_PUBLIC_DOMAIN}/${v.bunny_id}` : null
        }));

        if (!userId && offset === 0 && limit === 12) {
            c.executionCtx.waitUntil(
                env.MURAL_STORE.put(cacheKey, JSON.stringify(videosWithUrl), { expirationTtl: 300 })
            );
            c.header('Cache-Control', 'public, max-age=30');
        }

        return createResponse(c, videosWithUrl);
    } catch (err) {
        throw err;
    }
};

// Função: Listar vídeos restritos (Secret)
export const listSecretVideos = async (c) => {
    const env = c.env;
    const userId = c.req.query("user_id");
    const limit = parseInt(c.req.query("limit") || "12");
    const offset = parseInt(c.req.query("offset") || "0");
    const type = c.req.query("type");

    const cacheKey = `videos_secret_${type || 'all'}`;

    if (!userId && offset === 0 && limit === 12) {
        try {
            const cached = await env.MURAL_STORE.get(cacheKey, { type: 'json' });
            if (cached) return createResponse(c, cached);
        } catch (e) { }
    }

    try {
        let sql = `
      SELECT v.*, u.username,
      (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
      (SELECT COUNT(*) FROM views WHERE video_id = v.id) as views,
      (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments_count
    `;

        const params = [];
        let paramCount = 1;

        if (userId) {
            sql += `, EXISTS(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = $${paramCount++}) as user_liked`;
            params.push(userId);
        }

        sql += `
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.is_restricted = true
    `;

        if (type === 'photo') {
            sql += ` AND v.type = 'photo'`;
        } else if (type === 'video') {
            sql += ` AND (v.type = 'video' OR v.type IS NULL)`;
        }

        sql += `
      ORDER BY v.created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
        params.push(limit, offset);

        const { rows } = await queryDB(sql, params, env);

        const videosWithUrl = rows.map(v => ({
            ...v,
            video_url: v.bunny_id ? `${env.R2_PUBLIC_DOMAIN}/${v.bunny_id}` : null
        }));

        if (!userId && offset === 0 && limit === 12) {
            c.executionCtx.waitUntil(
                env.MURAL_STORE.put(cacheKey, JSON.stringify(videosWithUrl), { expirationTtl: 60 })
            );
        }

        return createResponse(c, videosWithUrl);
    } catch (err) {
        throw err;
    }
};

// Função: Buscar detalhes de um vídeo por ID
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
        throw err;
    }
};

// Função: Pesquisar vídeos por título ou descrição
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

        const videosWithUrl = rows.map(v => ({
            ...v,
            video_url: v.bunny_id ? `${env.R2_PUBLIC_DOMAIN}/${v.bunny_id}` : null
        }));

        return createResponse(c, videosWithUrl);
    } catch (err) {
        throw err;
    }
};
