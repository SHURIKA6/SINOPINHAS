import { queryDB } from '../db/index.js';
import { hash } from '../utils/hash.js';
import { logAudit } from '../middleware/audit.js';

export const login = async (c) => {
    const env = c.env;
    try {
        const { password } = await c.req.json();

        if (password === env.ADMIN_PASSWORD) {
            await logAudit(null, "ADMIN_LOGIN_SUCCESS", {}, c);
            console.log("✅ Admin login bem-sucedido");
            return c.json({ success: true });
        }

        await logAudit(null, "ADMIN_LOGIN_FAILED", {}, c);
        console.log("❌ Admin login falhou - senha incorreta");
        return c.json({ error: "Senha incorreta" }, 401);
    } catch (err) {
        console.error("❌ Erro no login admin:", err);
        return c.json({ error: "Erro no servidor" }, 500);
    }
};

export const listUsers = async (c) => {
    const env = c.env;
    const adminPassword = c.req.query("admin_password");

    if (adminPassword !== env.ADMIN_PASSWORD) {
        console.log("❌ Tentativa de acesso admin não autorizado");
        return c.json({ error: "Não autorizado" }, 403);
    }

    try {
        const { rows } = await queryDB(
            "SELECT id, username, created_at FROM users ORDER BY created_at DESC",
            [],
            env
        );

        console.log(`✅ Admin listou ${rows.length} usuários`);
        return c.json(rows);
    } catch (err) {
        console.error("❌ Erro ao listar usuários:", err);
        return c.json({ error: "Erro ao listar usuários" }, 500);
    }
};

export const resetPassword = async (c) => {
    const env = c.env;
    try {
        const { user_id, admin_password } = await c.req.json();

        if (admin_password !== env.ADMIN_PASSWORD) {
            return c.json({ error: "Não autorizado" }, 403);
        }

        const hashedPassword = await hash("123456");
        await queryDB("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, user_id], env);

        await logAudit(null, "ADMIN_PASSWORD_RESET", { target_user_id: user_id }, c);
        console.log(`✅ Admin resetou senha do User ${user_id}`);

        return c.json({ success: true });
    } catch (err) {
        console.error("❌ Erro ao resetar senha:", err);
        return c.json({ error: "Erro ao resetar senha" }, 500);
    }
};

export const banUser = async (c) => {
    const userId = c.req.param("userId");
    const env = c.env;
    try {
        const { admin_password } = await c.req.json();

        if (admin_password !== env.ADMIN_PASSWORD) {
            return c.json({ error: "Não autorizado" }, 403);
        }

        await queryDB("DELETE FROM videos WHERE user_id = $1", [userId], env);
        await queryDB("DELETE FROM comments WHERE user_id = $1", [userId], env);
        await queryDB("DELETE FROM likes WHERE user_id = $1", [userId], env);
        await queryDB("DELETE FROM messages WHERE from_id = $1 OR to_id = $1", [userId], env);
        await queryDB("DELETE FROM users WHERE id = $1", [userId], env);

        await logAudit(null, "ADMIN_USER_BANNED", { target_user_id: userId }, c);
        console.log(`✅ Admin baniu User ${userId}`);

        return c.json({ success: true });
    } catch (err) {
        console.error("❌ Erro ao banir usuário:", err);
        return c.json({ error: "Erro ao banir usuário" }, 500);
    }
};

export const getLogs = async (c) => {
    const env = c.env;
    const adminPassword = c.req.query("admin_password");

    if (adminPassword !== env.ADMIN_PASSWORD) {
        console.log("❌ Tentativa de acesso aos logs não autorizada");
        return c.json({ error: "Não autorizado" }, 403);
    }

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
        return c.json(rows);
    } catch (err) {
        console.error("❌ Erro ao buscar logs:", err);
        return c.json({ error: "Erro ao buscar logs" }, 500);
    }
};
