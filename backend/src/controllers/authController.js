import { queryDB } from '../db/index.js';
import { hash, compare } from '../utils/hash.js';
import { logAudit } from '../middleware/audit.js';

export const register = async (c) => {
    const env = c.env;
    try {
        const body = await c.req.json();
        console.log("📦 Body recebido no registro:", JSON.stringify(body, null, 2));

        const username = body.username;
        const password = body.password;

        if (username.length < 4) {
            console.log("❌ Username muito curto");
            // logAudit(null, "REGISTER_FAILED_USERNAME_SHORT", body, c); // optional
            return c.json({ error: "Nome de usuário deve ter pelo menos 4 caracteres" }, 400);
        }

        console.log(`🔍 Verificando se "${username}" existe...`);
        const { rows: existing } = await queryDB(
            "SELECT * FROM users WHERE username = $1",
            [username],
            env
        );

        if (existing.length > 0) {
            console.log(`❌ Usuário "${username}" já existe`);
            await logAudit(null, "REGISTER_FAILED_USERNAME_EXISTS", { username, ...body }, c);
            return c.json({ error: "Usuário já existe" }, 400);
        }

        console.log("🔐 Gerando hash da senha...");
        const hashedPassword = await hash(password);

        console.log("💾 Inserindo usuário no banco...");
        const { rows } = await queryDB(
            "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, avatar, bio",
            [username, hashedPassword],
            env
        );

        const user = rows[0];
        console.log(`✅ Usuário criado com sucesso: ${username} (ID: ${user.id})`);

        try {
            await logAudit(user.id, "USER_REGISTERED", body, c);
        } catch (logErr) {
            console.error("⚠️ Erro ao salvar log (não crítico):", logErr.message);
        }

        return c.json({ user });
    } catch (err) {
        console.error("❌ ERRO CRÍTICO AO REGISTRAR:", err);
        console.error("Stack trace:", err.stack);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json({ error: "Erro no servidor: " + err.message }, 500);
    }
};

export const login = async (c) => {
    const env = c.env;
    try {
        const body = await c.req.json();
        console.log("📦 Body recebido no login:", JSON.stringify(body, null, 2));

        const username = body.username;
        const password = body.password;

        if (!username || !password) {
            console.log("❌ Campos vazios no login");
            await logAudit(null, "LOGIN_FAILED_MISSING_FIELDS", body, c);
            return c.json({ error: "Preencha todos os campos" }, 400);
        }

        console.log(`🔍 Buscando usuário: "${username}"`);
        const { rows } = await queryDB(
            "SELECT * FROM users WHERE username = $1",
            [username],
            env
        );

        if (rows.length === 0) {
            console.log(`❌ Usuário "${username}" não encontrado`);
            await logAudit(null, "LOGIN_FAILED_USER_NOT_FOUND", { username, ...body }, c);
            return c.json({ error: "Usuário ou senha incorretos" }, 401);
        }

        const user = rows[0];
        console.log(`🔐 Verificando senha para usuário ID: ${user.id}`);
        const validPassword = await compare(password, user.password);

        if (!validPassword) {
            console.log(`❌ Senha incorreta para usuário: ${username}`);
            await logAudit(user.id, "LOGIN_FAILED_WRONG_PASSWORD", { username, ...body }, c);
            return c.json({ error: "Usuário ou senha incorretos" }, 401);
        }

        console.log(`✅ Login bem-sucedido: ${username} (ID: ${user.id})`);

        try {
            await logAudit(user.id, "USER_LOGIN_SUCCESS", body, c);
        } catch (logErr) {
            console.error("⚠️ Erro ao salvar log (não crítico):", logErr.message);
        }

        return c.json({
            user: {
                id: user.id,
                username: user.username,
                avatar: user.avatar,
                bio: user.bio,
            },
        });
    } catch (err) {
        console.error("❌ ERRO CRÍTICO AO FAZER LOGIN:", err);
        console.error("Stack trace:", err.stack);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json({ error: "Erro no servidor: " + err.message }, 500);
    }
};

export const updateProfile = async (c) => {
    const userId = c.req.param("id");
    const env = c.env;
    try {
        const { password, avatar, bio } = await c.req.json();
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
            return c.json({ error: "Nenhum campo para atualizar" }, 400);
        }

        values.push(userId);
        const { rows } = await queryDB(
            `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id, username, avatar, bio`,
            values,
            env
        );

        await logAudit(userId, "USER_PROFILE_UPDATED", { updates: updates.join(", ") }, c);
        console.log(`✅ Perfil atualizado: User ID ${userId}`);

        return c.json(rows[0]);
    } catch (err) {
        console.error("❌ Erro ao atualizar perfil:", err);
        c.header('Access-Control-Allow-Origin', 'https://sinopinhas.vercel.app');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return c.json({ error: "Erro no servidor" }, 500);
    }
};
