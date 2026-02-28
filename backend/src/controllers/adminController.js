import { queryDB } from '../db/index.js';
import { hash } from '../utils/hash.js';
import { logAudit } from '../middleware/audit.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';
import { sign } from 'hono/jwt';
import { sendToGoogleSheets } from '../utils/google-sheets.js';

const getJwtSecret = (env) => {
    if (!env.JWT_SECRET) {
        throw new Error('FATAL: JWT_SECRET não configurado');
    }
    return env.JWT_SECRET;
};

// Comparação timing-safe para evitar timing attacks
async function timingSafeCompare(a, b) {
    const encoder = new TextEncoder();
    const aBytes = encoder.encode(a);
    const bBytes = encoder.encode(b);
    // Pad para mesmo tamanho (evita leak de comprimento)
    const maxLen = Math.max(aBytes.length, bBytes.length);
    const aPadded = new Uint8Array(maxLen);
    const bPadded = new Uint8Array(maxLen);
    aPadded.set(aBytes);
    bPadded.set(bBytes);
    // Importar como chave HMAC e comparar via crypto.subtle
    const key = await crypto.subtle.importKey('raw', aPadded, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, bPadded);
    const key2 = await crypto.subtle.importKey('raw', bPadded, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig2 = await crypto.subtle.sign('HMAC', key2, aPadded);
    // Comparar os MACs dos inputs cruzados — se a === b, os resultados serão iguais
    const s1 = new Uint8Array(sig);
    const s2 = new Uint8Array(sig2);
    if (s1.length !== s2.length) return false;
    let result = 0;
    for (let i = 0; i < s1.length; i++) result |= s1[i] ^ s2[i];
    return result === 0 && aBytes.length === bBytes.length;
}

// Função: Realizar login administrativo
export const login = async (c) => {
    const env = c.env;
    try {
        const { password } = await c.req.json();

        const isValid = await timingSafeCompare(password || '', env.ADMIN_PASSWORD || '');
        if (isValid) {
            await logAudit(null, "ADMIN_LOGIN_SUCCESS", {}, c);
            const token = await sign({
                id: 0,
                username: 'Admin',
                role: 'admin',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
            }, getJwtSecret(env));

            c.header('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=86400`);
            return createResponse(c, { success: true });
        }

        await logAudit(null, "ADMIN_LOGIN_FAILED", {}, c);
        return createErrorResponse(c, "AUTH_ERROR", "Senha incorreta", 401);
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro no servidor", 500);
    }
};

// Função: Listar todos os usuários
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

// Função: Resetar senha de um usuário
export const resetPassword = async (c) => {
    const env = c.env;
    try {
        const { user_id } = await c.req.json();
        // Gerar senha temporária aleatória segura
        const tempBytes = new Uint8Array(6);
        crypto.getRandomValues(tempBytes);
        const tempPassword = Array.from(tempBytes).map(b => b.toString(36).padStart(2, '0')).join('').substring(0, 10);
        const hashedPassword = await hash(tempPassword);
        await queryDB("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, user_id], env);
        await logAudit(null, "ADMIN_PASSWORD_RESET", { target_user_id: user_id }, c);
        return createResponse(c, { success: true, temp_password: tempPassword });
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao resetar senha", 500);
    }
};

// Função: Banir e remover dados do usuário
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

        c.executionCtx.waitUntil(sendToGoogleSheets('admin_actions', {
            action: 'BAN_USER', target_user_id: userId
        }, env));
        return createResponse(c, { success: true });
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao banir usuário: " + err.message, 500);
    }
};

// Função: Alternar permissões de administrador
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

        c.executionCtx.waitUntil(sendToGoogleSheets('admin_actions', {
            action: 'ROLE_CHANGE', target_user_id: user_id, new_role: newRole
        }, env));

        return createResponse(c, { success: true, user: rows[0] });
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao alterar privilégios", 500);
    }
};

// Função: Buscar logs gerais do sistema
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
            } catch (e) { /* JSON parse fallback — details ficam como {} */ }

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

// Função: Buscar logs de um usuário específico
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
            [parseInt(userId, 10)],
            env
        );

        const flattenedLogs = rows.map(log => {
            let details = {};
            try {
                details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            } catch (e) { /* JSON parse fallback — details ficam como {} */ }

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
