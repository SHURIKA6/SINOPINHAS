import { queryDB } from '../db/index.js';
import { hash, compare } from '../utils/hash.js';
import { logAudit } from '../middleware/audit.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';
import { sign } from 'hono/jwt';
import { updateProfileSchema } from '../schemas/auth.js';

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
            "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, avatar, bio",
            [username, hashedPassword],
            env
        );

        const user = rows[0];
        try {
            await logAudit(user.id, "USER_REGISTERED", body, c);
        } catch (logErr) { }

        const token = await sign({
            id: user.id,
            username: user.username,
            role: 'user',
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
        }, c.env.JWT_SECRET);

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

        const user = rows[0];
        const validPassword = await compare(password, user.password);

        if (!validPassword) {
            await logAudit(user.id, "LOGIN_FAILED_WRONG_PASSWORD", { username }, c);
            return createErrorResponse(c, "AUTH_ERROR", "Usuário ou senha incorretos", 401);
        }

        try {
            await logAudit(user.id, "USER_LOGIN_SUCCESS", { username }, c);
        } catch (logErr) { }

        const token = await sign({
            id: user.id,
            username: user.username,
            role: 'user',
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
        }, c.env.JWT_SECRET);

        return createResponse(c, {
            user: {
                id: user.id,
                username: user.username,
                avatar: user.avatar,
                bio: user.bio,
            },
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
            return createErrorResponse(c, "FORBIDDEN", "Você não tem permissão para editar este perfil.", 403);
        }

        const contentType = c.req.header('content-type');
        let password, currentPassword, avatar, bio, avatarFile;

        if (contentType && contentType.includes('multipart/form-data')) {
            const formData = await c.req.formData();
            password = formData.get('password');
            currentPassword = formData.get('currentPassword');
            avatar = formData.get('avatar');
            bio = formData.get('bio');
            avatarFile = formData.get('avatarFile');
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
        // FormData pode retornar null para campos ausentes, Zod .optional() espera undefined
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
        // Usamos uma verificação mais robusta do que instanceof File
        if (avatarFile && typeof avatarFile === 'object' && (avatarFile.name || avatarFile.type)) {
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 10);
            const extension = avatarFile.name.split('.').pop() || 'jpg';
            const r2Key = `avatars/${userId}-${timestamp}-${randomStr}.${extension}`;

            // O objeto File/Blob pode ser passado diretamente para o R2 no Cloudflare Workers
            await env.VIDEO_BUCKET.put(r2Key, avatarFile, {
                httpMetadata: { contentType: avatarFile.type || 'image/jpeg' },
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

        values.push(userId);
        const { rows } = await queryDB(
            `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id, username, avatar, bio`,
            values,
            env
        );

        await logAudit(userId, "USER_PROFILE_UPDATED", {
            avatar_changed: avatar !== undefined,
            bio_changed: bio !== undefined,
            password_changed: !!password,
            avatar_uploaded: !!avatarFile
        }, c);

        return createResponse(c, rows[0]);
    } catch (err) {
        console.error("Error updating profile:", err);
        throw err;
    }
};
