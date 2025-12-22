import { queryDB } from '../db/index.js';
import { hash, compare } from '../utils/hash.js';
import { logAudit } from '../middleware/audit.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';
import { sign } from 'hono/jwt';
import { updateProfileSchema } from '../schemas/auth.js';
import { getAchievementList } from '../utils/user-achievements.js';

// Helper para buscar usuário completo com conquistas
const getFullUser = async (userId, env) => {
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
    if (rows.length === 0) return null;
    const u = rows[0];
    return {
        ...u,
        achievements: getAchievementList(u)
    };
};

// Registrar usuário
export const register = async (c) => {
    const env = c.env;
    try {
        const body = await c.req.json();
        const username = body.username;
        const password = body.password;

        if (username.length < 4) {
            return createErrorResponse(c, "INVALID_INPUT", "Nome de usuário deve ter pelo menos 4 caracteres", 400);
        }

        const { rows: existing } = await queryDB(
            "SELECT * FROM users WHERE username = $1",
            [username],
            env
        );

        if (existing.length > 0) {
            await logAudit(null, "REGISTER_FAILED_USERNAME_EXISTS", { username }, c);
            return createErrorResponse(c, "USER_EXISTS", "Usuário já existe", 400);
        }

        const hashedPassword = await hash(password);
        const { rows } = await queryDB(
            "INSERT INTO users (username, password, role) VALUES ($1, $2, 'user') RETURNING id, username, avatar, bio, role",
            [username, hashedPassword],
            env
        );

        const user = await getFullUser(rows[0].id, env);
        try {
            await logAudit(user.id, "USER_REGISTERED", body, c);
        } catch (logErr) { }

        const token = await sign({
            id: user.id,
            username: user.username,
            role: user.role || 'user',
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
        }, env.JWT_SECRET || 'development_secret_123');

        return createResponse(c, { user, token });
    } catch (err) {
        throw err;
    }
};

// Login de usuário
export const login = async (c) => {
    const env = c.env;
    try {
        const body = await c.req.json();
        const username = body.username;
        const password = body.password;

        if (!username || !password) {
            await logAudit(null, "LOGIN_FAILED_MISSING_FIELDS", { username }, c);
            return createErrorResponse(c, "INVALID_INPUT", "Preencha todos os campos", 400);
        }

        const { rows } = await queryDB(
            "SELECT * FROM users WHERE username = $1",
            [username],
            env
        );

        if (rows.length === 0) {
            await logAudit(null, "LOGIN_FAILED_USER_NOT_FOUND", { username }, c);
            return createErrorResponse(c, "AUTH_ERROR", "Usuário ou senha incorretos", 401);
        }

        const validPassword = await compare(password, rows[0].password);

        if (!validPassword) {
            await logAudit(rows[0].id, "LOGIN_FAILED_WRONG_PASSWORD", { username }, c);
            return createErrorResponse(c, "AUTH_ERROR", "Usuário ou senha incorretos", 401);
        }

        try {
            await logAudit(rows[0].id, "USER_LOGIN_SUCCESS", { username }, c);
        } catch (logErr) { }

        const user = await getFullUser(rows[0].id, env);

        const token = await sign({
            id: user.id,
            username: user.username,
            role: user.role || 'user',
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
        }, env.JWT_SECRET || 'development_secret_123');

        return createResponse(c, {
            user,
            token
        });
    } catch (err) {
        throw err;
    }
};

// Atualizar perfil
export const updateProfile = async (c) => {
    const userId = c.req.param("id");
    const env = c.env;
    const payload = c.get('jwtPayload');

    try {
        // Verificar se o usuário autenticado é o dono do perfil ou um admin
        if (!payload || (payload.id != userId && payload.role !== 'admin')) {
            console.warn(`⚠️ Forbidden update attempt: User ${payload?.id} tried to update User ${userId}`);
            return createErrorResponse(c, "FORBIDDEN", "Você não tem permissão para editar este perfil.", 403);
        }

        const contentType = c.req.header('content-type');
        let password, currentPassword, avatar, bio, avatarFile;

        if (contentType && contentType.includes('multipart/form-data')) {
            try {
                const formData = await c.req.formData();
                password = formData.get('password');
                currentPassword = formData.get('currentPassword');
                avatar = formData.get('avatar');
                bio = formData.get('bio');
                avatarFile = formData.get('avatarFile');
            } catch (formErr) {
                console.error("Error parsing formData:", formErr);
                return createErrorResponse(c, "INVALID_INPUT", "Erro ao processar formulário.", 400);
            }
        } else {
            try {
                const body = await c.req.json();
                password = body.password;
                currentPassword = body.currentPassword;
                avatar = body.avatar;
                bio = body.bio;
            } catch (e) {
                // If body is empty or not JSON, we just continue with what we have
            }
        }

        // Validação adicional com Zod
        const validationResult = updateProfileSchema.safeParse({
            password: password || undefined,
            avatar: (typeof avatar === 'string' ? avatar : undefined),
            bio: (typeof bio === 'string' ? bio : undefined)
        });

        if (!validationResult.success) {
            const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
            return createErrorResponse(c, "INVALID_INPUT", errors, 400);
        }

        // Se houver um arquivo de avatar, fazer o upload para o R2
        if (avatarFile && typeof avatarFile === 'object') {
            const fileName = avatarFile.name || 'avatar.jpg';
            const fileType = avatarFile.type || 'image/jpeg';

            // Verificamos se VIDEO_BUCKET está disponível
            if (!env.VIDEO_BUCKET) {
                console.error("❌ VIDEO_BUCKET binding is missing in environment!");
                throw new Error("Serviço de armazenamento indisponível.");
            }

            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 10);
            const extension = fileName.split('.').pop() || 'jpg';
            const r2Key = `avatars/${userId}-${timestamp}-${randomStr}.${extension}`;

            // Converter para ArrayBuffer para garantir compatibilidade com o put do R2
            const data = await avatarFile.arrayBuffer();

            await env.VIDEO_BUCKET.put(r2Key, data, {
                httpMetadata: { contentType: fileType },
            });

            // A URL final será baseada no domínio público do R2
            avatar = `${env.R2_PUBLIC_DOMAIN}/${r2Key}`;
        }

        // Se estiver tentando mudar a senha, precisamos validar a senha atual
        if (password) {
            const { rows: userRows } = await queryDB("SELECT password FROM users WHERE id = $1", [userId], env);
            if (userRows.length === 0) {
                return createErrorResponse(c, "NOT_FOUND", "Usuário não encontrado", 404);
            }

            if (!currentPassword) {
                return createErrorResponse(c, "REQUIRED_FIELD", "Senha atual é necessária para definir uma nova senha", 400);
            }

            const isMatch = await compare(currentPassword, userRows[0].password);
            if (!isMatch) {
                await logAudit(userId, "PASSWORD_UPDATE_FAILED_WRONG_CURRENT", {}, c);
                return createErrorResponse(c, "AUTH_ERROR", "Senha atual incorreta", 401);
            }
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (password) {
            const hashedPassword = await hash(password);
            updates.push(`password = $${paramCount++}`);
            values.push(hashedPassword);
        }
        if (avatar !== null && avatar !== undefined) {
            updates.push(`avatar = $${paramCount++}`);
            values.push(avatar);
        }
        if (bio !== null && bio !== undefined) {
            updates.push(`bio = $${paramCount++}`);
            values.push(bio);
        }

        if (updates.length === 0) {
            return createErrorResponse(c, "INVALID_INPUT", "Nenhum campo para atualizar", 400);
        }

        // Usar parseInt para garantir que o ID é tratado como número pelo banco
        const targetId = parseInt(userId, 10);
        values.push(targetId);

        const { rows } = await queryDB(
            `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id, username, avatar, bio, role`,
            values,
            env
        );

        if (rows.length === 0) {
            return createErrorResponse(c, "NOT_FOUND", "Usuário não encontrado para atualização", 404);
        }

        const decoratedUser = await getFullUser(userId, env);

        await logAudit(userId, "USER_PROFILE_UPDATED", {
            avatar_changed: avatar !== undefined,
            bio_changed: bio !== undefined,
            password_changed: !!password,
            avatar_uploaded: !!avatarFile
        }, c);

        return createResponse(c, decoratedUser);
    } catch (err) {
        console.error("🔥 Error updating profile:", err);
        // Retornar um erro mais descritivo se possível
        return createErrorResponse(c, "INTERNAL_ERROR", `Erro ao atualizar perfil: ${err.message}`, 500);
    }
};

// Marcar que o usuário descobriu os logs (Achievement Hacker)
export const discoverLogs = async (c) => {
    const userId = c.req.param("id");
    const env = c.env;
    const payload = c.get('jwtPayload');

    try {
        if (!payload || (payload.id != userId)) {
            return createErrorResponse(c, "FORBIDDEN", "Unauthorized", 403);
        }

        await queryDB(
            "UPDATE users SET discovered_logs = TRUE WHERE id = $1",
            [parseInt(userId, 10)],
            env
        );

        const user = await getFullUser(userId, env);
        return createResponse(c, user);
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", err.message, 500);
    }
};

