import { queryDB } from '../db/index.js';
import { hash, compare } from '../utils/hash.js';
import { logAudit } from '../middleware/audit.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';
import { sign } from 'hono/jwt';

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
            await logAudit(null, "REGISTER_FAILED_USERNAME_EXISTS", { username, ...body }, c);
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
        }, c.env.JWT_SECRET || 'development_secret_123');

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
            await logAudit(null, "LOGIN_FAILED_MISSING_FIELDS", body, c);
            return createErrorResponse(c, "INVALID_INPUT", "Preencha todos os campos", 400);
        }

        const { rows } = await queryDB(
            "SELECT * FROM users WHERE username = $1",
            [username],
            env
        );

        if (rows.length === 0) {
            await logAudit(null, "LOGIN_FAILED_USER_NOT_FOUND", { username, ...body }, c);
            return createErrorResponse(c, "AUTH_ERROR", "Usuário ou senha incorretos", 401);
        }

        const user = rows[0];
        const validPassword = await compare(password, user.password);

        if (!validPassword) {
            await logAudit(user.id, "LOGIN_FAILED_WRONG_PASSWORD", { username, ...body }, c);
            return createErrorResponse(c, "AUTH_ERROR", "Usuário ou senha incorretos", 401);
        }

        try {
            await logAudit(user.id, "USER_LOGIN_SUCCESS", body, c);
        } catch (logErr) { }

        const token = await sign({
            id: user.id,
            username: user.username,
            role: 'user',
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
        }, c.env.JWT_SECRET || 'development_secret_123');

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
    try {
        const { password, currentPassword, avatar, bio } = await c.req.json();

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
        if (avatar !== undefined) {
            updates.push(`avatar = $${paramCount++}`);
            values.push(avatar);
        }
        if (bio !== undefined) {
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
            password_changed: !!password
        }, c);

        return createResponse(c, rows[0]);
    } catch (err) {
        throw err;
    }
};
