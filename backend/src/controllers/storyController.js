import { queryDB } from '../db/index.js';
import { logAudit } from '../middleware/audit.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../utils/constants.js';
import { validateMagicBytes } from '../utils/file-validation.js';

// Função: Upload de Story
export const uploadStory = async (c) => {
    const env = c.env;
    try {
        const formData = await c.req.formData();
        const file = formData.get("file");
        const caption = formData.get("caption") || "";

        const payload = c.get('jwtPayload');
        const userId = payload?.id;

        if (!file || !userId) {
            return createErrorResponse(c, "INVALID_INPUT", "Arquivo e autenticação são obrigatórios", 400);
        }

        // Validações básicas (mesmas do videoController)
        if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
            return createErrorResponse(c, "INVALID_FILE_TYPE", "Tipo de arquivo não permitido", 400);
        }
        if (file.size && file.size > MAX_FILE_SIZE) {
            return createErrorResponse(c, "FILE_TOO_LARGE", "Arquivo muito grande (max 50MB)", 400);
        }

        // Magic Bytes Validation
        if (file.arrayBuffer) {
            const headerBytes = await file.slice(0, 16).arrayBuffer();
            const magicResult = validateMagicBytes(headerBytes, file.type);
            if (!magicResult.valid) {
                return createErrorResponse(c, "INVALID_FILE_CONTENT", magicResult.reason, 400);
            }
        }

        const type = file.type.startsWith("image/") ? "photo" : "video";
        const duration = type === 'photo' ? 5 : 15; // Vídeos de stories normalmente têm limite curto, aqui assumimos 15s se não vier metadata

        // Upload para R2
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const fileName = (typeof file === 'string') ? 'file' : file.name || 'file';
        const extension = fileName.split('.').pop();
        const r2Key = `story-${userId}-${timestamp}-${randomStr}.${extension}`;

        await env.VIDEO_BUCKET.put(r2Key, file.stream(), {
            httpMetadata: { contentType: file.type }
        });

        // Salvar no banco
        const { rows } = await queryDB(
            `INSERT INTO stories (user_id, bunny_id, media_type, duration, caption, expires_at)
             VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')
             RETURNING id, created_at, expires_at`,
            [userId, r2Key, type, duration, caption],
            env
        );

        await logAudit(userId, "STORY_UPLOADED", { story_id: rows[0].id, type }, c);

        return createResponse(c, { success: true, story: rows[0] });
    } catch (err) {
        console.error("Story upload error:", err);
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao postar story", 500);
    }
};

// Função: Listar Stories (agrupados por usuário)
export const listStories = async (c) => {
    const env = c.env;
    const payload = c.get('jwtPayload');
    const currentUserId = payload?.id || 0; // Se não logado, 0 para user_viewed check

    try {
        // Busca stories não expirados
        const { rows } = await queryDB(
            `SELECT s.*, u.username, u.avatar,
             EXISTS(SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.user_id = $1) as viewed
             FROM stories s
             JOIN users u ON s.user_id = u.id
             WHERE s.expires_at > NOW()
             ORDER BY s.created_at ASC`,
            [currentUserId],
            env
        );

        // Agrupar por usuário
        const storiesByUser = {};
        rows.forEach(story => {
            const uid = story.user_id;
            if (!storiesByUser[uid]) {
                storiesByUser[uid] = {
                    user_id: uid,
                    username: story.username,
                    avatar: story.avatar,
                    stories: [],
                    all_viewed: true // Assume true, se achar um false muda
                };
            }

            const storyUrl = `${env.R2_PUBLIC_DOMAIN}/${story.bunny_id}`;
            storiesByUser[uid].stories.push({
                ...story,
                media_url: storyUrl
            });

            if (!story.viewed) {
                storiesByUser[uid].all_viewed = false;
            }
        });

        // Converter para array e ordenar: quem tem stories não vistos primeiro
        const result = Object.values(storiesByUser).sort((a, b) => {
            // Se 'a' tem unviewed e 'b' tudo viewed, 'a' vem antes
            if (!a.all_viewed && b.all_viewed) return -1;
            if (a.all_viewed && !b.all_viewed) return 1;
            return 0; // Ordem de chegada/ID
        });

        return createResponse(c, result);
    } catch (err) {
        console.error("List stories error:", err);
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao listar stories", 500);
    }
};

// Função: Marcar story como visto
export const viewStory = async (c) => {
    const env = c.env;
    const storyId = c.req.param("id");
    const payload = c.get('jwtPayload');
    const userId = payload?.id;

    if (!userId) return createErrorResponse(c, "UNAUTHORIZED", "Login required", 401);

    try {
        // Tenta inserir view. Se já existe (UNIQUE constraint), ignora erro
        await queryDB(
            `INSERT INTO story_views (story_id, user_id) VALUES ($1, $2)
             ON CONFLICT (story_id, user_id) DO NOTHING`,
            [storyId, userId],
            env
        );

        return createResponse(c, { success: true });
    } catch (err) {
        // Ignora erros silenciosamente para não travar UI, mas loga se for grave
        return createResponse(c, { success: true });
    }
};

// Função: Deletar story
export const deleteStory = async (c) => {
    const env = c.env;
    const storyId = c.req.param("id");
    const payload = c.get('jwtPayload');
    const userId = payload?.id;

    try {
        const { rows } = await queryDB("SELECT user_id, bunny_id FROM stories WHERE id = $1", [storyId], env);
        if (rows.length === 0) return createErrorResponse(c, "NOT_FOUND", "Story not found", 404);

        const story = rows[0];
        if (story.user_id !== userId && payload.role !== 'admin') {
            return createErrorResponse(c, "FORBIDDEN", "Sem permissão", 403);
        }

        // Deletar do R2
        try {
            await env.VIDEO_BUCKET.delete(story.bunny_id);
        } catch (e) { }

        await queryDB("DELETE FROM stories WHERE id = $1", [storyId], env);

        return createResponse(c, { success: true });
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao deletar story", 500);
    }
};
