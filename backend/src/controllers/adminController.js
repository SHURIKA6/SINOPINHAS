import { queryDB } from '../db/index.js';
import { hash } from '../utils/hash.js';
import { logAudit } from '../middleware/audit.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';
import { sign } from 'hono/jwt';

// Helper to get secret consistently
const getJwtSecret = (env) => env.JWT_SECRET || 'development_secret_123';

// --- Login Administrativo ---
export const login = async (c) => {
    const env = c.env;
    try {
        const { password } = await c.req.json();

        if (password === env.ADMIN_PASSWORD) {
            await logAudit(null, "ADMIN_LOGIN_SUCCESS", {}, c);
            console.log("✅ Admin login bem-sucedido");

            const token = await sign({
                id: 'admin',
                role: 'admin',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours
            }, getJwtSecret(env));

            return createResponse(c, { success: true, token });
        }

        await logAudit(null, "ADMIN_LOGIN_FAILED", {}, c);
        console.log("❌ Admin login falhou - senha incorreta");
        return createErrorResponse(c, "AUTH_ERROR", "Senha incorreta", 401);
    } catch (err) {
        console.error("❌ Erro no login admin:", err);
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro no servidor", 500);
    }
};

// --- Gestão de Usuários ---
export const listUsers = async (c) => {
    const env = c.env;

    // Auth handled by requireAdmin middleware

    try {
        const { rows } = await queryDB(
            "SELECT id, username, created_at FROM users ORDER BY created_at DESC",
            [],
            env
        );

        console.log(`✅ Admin listou ${rows.length} usuários`);
        return createResponse(c, rows);
    } catch (err) {
        console.error("❌ Erro ao listar usuários:", err);
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao listar usuários", 500);
    }
};

// --- Reset de Senha ---
export const resetPassword = async (c) => {
    const env = c.env;
    try {
        const { user_id } = await c.req.json();

        // Admin check is already handled by middleware


        const hashedPassword = await hash("123456");
        await queryDB("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, user_id], env);

        await logAudit(null, "ADMIN_PASSWORD_RESET", { target_user_id: user_id }, c);
        console.log(`✅ Admin resetou senha do User ${user_id}`);

        return createResponse(c, { success: true });
    } catch (err) {
        console.error("❌ Erro ao resetar senha:", err);
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao resetar senha", 500);
    }
};

// --- Banimento de Usuários ---
export const banUser = async (c) => {
    const userId = c.req.param("userId");
    const env = c.env;
    try {
        // Admin check is already handled by middleware

        // Cascading delete
        await queryDB("DELETE FROM videos WHERE user_id = $1", [userId], env);
        await queryDB("DELETE FROM comments WHERE user_id = $1", [userId], env);
        await queryDB("DELETE FROM likes WHERE user_id = $1", [userId], env);
        await queryDB("DELETE FROM messages WHERE from_id = $1 OR to_id = $1", [userId], env);
        await queryDB("DELETE FROM users WHERE id = $1", [userId], env);

        await logAudit(null, "ADMIN_USER_BANNED", { target_user_id: userId }, c);
        console.log(`✅ Admin baniu User ${userId}`);

        return createResponse(c, { success: true });
    } catch (err) {
        console.error("❌ Erro ao banir usuário:", err);
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao banir usuário", 500);
    }
};

// --- Logs do Sistema ---
export const getLogs = async (c) => {
    const env = c.env;

    // Auth handled by middleware

    try {
        const { rows } = await queryDB(
            `SELECT a.*, u.username 
       FROM audit_logs a 
       LEFT JOIN users u ON a.user_id = u.id 
       ORDER BY a.created_at DESC 
       LIMIT 100`,
            [],
            env
        );

        console.log(`✅ Admin acessou ${rows.length} logs`);
        return createResponse(c, rows);
    } catch (err) {
        console.error("❌ Erro ao buscar logs:", err);
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao buscar logs", 500);
    }
};
