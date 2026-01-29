import { queryDB } from '../db/index.js';
import { hash } from '../utils/hash.js';
import { logAudit } from '../middleware/audit.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';
import { sign } from 'hono/jwt';

const getJwtSecret = (env) => env.JWT_SECRET || 'development_secret_123';

// Login administrativo
export const login = async (c) => {
    const env = c.env;
    try {
        const { password } = await c.req.json();

        if (password === env.ADMIN_PASSWORD) {
            await logAudit(null, "ADMIN_LOGIN_SUCCESS", {}, c);
            const token = await sign({
                id: 0,
                username: 'Admin',
                role: 'admin',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
            }, getJwtSecret(env));

            return createResponse(c, { success: true, token });
        }

        await logAudit(null, "ADMIN_LOGIN_FAILED", {}, c);
        return createErrorResponse(c, "AUTH_ERROR", "Senha incorreta", 401);
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro no servidor", 500);
    }
};

// Listar usuários
export const listUsers = async (c) => {
    const env = c.env;
    try {
        const { rows } = await queryDB(
            "SELECT id, username, role, created_at FROM users ORDER BY created_at DESC",
            [],
            env
        );
        return createResponse(c, rows);
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao listar usuários", 500);
    }
};

// Resetar senha de usuário
export const resetPassword = async (c) => {
    const env = c.env;
    try {
        const { user_id } = await c.req.json();
        const hashedPassword = await hash("123456");
        await queryDB("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, user_id], env);
        await logAudit(null, "ADMIN_PASSWORD_RESET", { target_user_id: user_id }, c);
        return createResponse(c, { success: true });
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao resetar senha", 500);
    }
};

// Banir usuário
export const banUser = async (c) => {
    const userId = c.req.param("userId");
    const env = c.env;
    try {
        await queryDB("DELETE FROM videos WHERE user_id = $1", [userId], env);
        await queryDB("DELETE FROM comments WHERE user_id = $1", [userId], env);
        await queryDB("DELETE FROM likes WHERE user_id = $1", [userId], env);
        await queryDB("DELETE FROM notifications WHERE user_id = $1 OR related_id = $1", [userId], env);
        await queryDB("DELETE FROM messages WHERE from_id = $1 OR to_id = $1", [userId], env);
        await queryDB("DELETE FROM users WHERE id = $1", [userId], env);
        await logAudit(null, "ADMIN_USER_BANNED", { target_user_id: userId }, c);
        return createResponse(c, { success: true });
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao banir usuário: " + err.message, 500);
    }
};

// Alternar status de admin de um usuário
export const toggleAdmin = async (c) => {
    const env = c.env;
    try {
        const { user_id, role } = await c.req.json();

        // Impede que o admin se auto-desbaixe se quisermos (opcional)
        // Mas aqui vamos permitir setar role ('admin' ou 'user')
        const newRole = role === 'admin' ? 'admin' : 'user';

        const { rows } = await queryDB(
            "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role",
            [newRole, user_id],
            env
        );

        if (rows.length === 0) {
            return createErrorResponse(c, "NOT_FOUND", "Usuário não encontrado", 404);
        }

        await logAudit(null, "ADMIN_ROLE_CHANGED", { target_user: rows[0].username, new_role: newRole }, c);

        return createResponse(c, { success: true, user: rows[0] });
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao alterar privilégios", 500);
    }
};

// Buscar logs do sistema
export const getLogs = async (c) => {
    const env = c.env;
    try {
        const { rows } = await queryDB(
            `SELECT a.*, u.username 
             FROM audit_logs a 
             LEFT JOIN users u ON a.user_id = u.id 
             ORDER BY a.created_at DESC 
             LIMIT 150`,
            [],
            env
        );

        // Achata o campo JSONB 'details' para facilitar o uso no frontend
        const flattenedLogs = rows.map(log => {
            let details = {};
            try {
                details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            } catch (e) { }

            return {
                ...log,
                ...details,
                // Garante que o IP principal do banco seja usado se o detalhes não tiver
                ip: details.ip || log.ip_address || 'unknown'
            };
        });

        return createResponse(c, flattenedLogs);
    } catch (err) {
        console.error("Erro ao buscar logs:", err);
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao buscar logs", 500);
    }
};

// Buscar logs de um usuário específico
export const getUserLogs = async (c) => {
    const env = c.env;
    const userId = c.req.param("userId");
    try {
        const { rows } = await queryDB(
            `SELECT a.*, u.username 
             FROM audit_logs a 
             LEFT JOIN users u ON a.user_id = u.id 
             WHERE a.user_id = $1
             ORDER BY a.created_at DESC 
             LIMIT 200`,
            [userId],
            env
        );

        const flattenedLogs = rows.map(log => {
            let details = {};
            try {
                details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            } catch (e) { }

            return {
                ...log,
                ...details,
                ip: details.ip || log.ip_address || 'unknown'
            };
        });

        return createResponse(c, flattenedLogs);
    } catch (err) {
        console.error("Erro ao buscar logs do usuário:", err);
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao buscar logs do usuário", 500);
    }
};
