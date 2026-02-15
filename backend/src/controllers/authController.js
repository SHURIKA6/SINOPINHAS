import { queryDB } from '../db/index.js';
import { hash, compare } from '../utils/hash.js';
import { logAudit } from '../middleware/audit.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';
import { sign } from 'hono/jwt';
import { updateProfileSchema } from '../schemas/auth.js';
import { getAchievementList } from '../utils/user-achievements.js';
import { sanitize } from '../utils/sanitize.js';

// Função Auxiliar: Busca usuário completo com conquistas
const getFullUser = async (userId, env) => {
    const { rows } = await queryDB(
        `SELECT id, username, email, avatar, bio, role, discovered_logs, created_at,
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

// Função: Registrar novo usuário
export const register = async (c) => {
    const env = c.env;
    try {
        const body = await c.req.json();
        const username = body.username;
        const password = body.password;

        if (!env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is not defined in environment variables.");
            return createErrorResponse(c, "INTERNAL_ERROR", "Configuration Error", 500);
        }

        if (username.length < 4) {
            return createErrorResponse(c, "INVALID_INPUT", "Nome de usuário deve ter pelo menos 4 caracteres", 400);
        }

        // Sanitizar username contra XSS
        const cleanUsername = sanitize(username);

        const { rows: existing } = await queryDB(
            "SELECT * FROM users WHERE username = $1",
            [cleanUsername],
            env
        );

        if (existing.length > 0) {
            await logAudit(null, "REGISTER_FAILED_USERNAME_EXISTS", { username: cleanUsername }, c);
            return createErrorResponse(c, "USER_EXISTS", "Usuário já existe", 400);
        }

        const hashedPassword = await hash(password);
        const { rows } = await queryDB(
            "INSERT INTO users (username, password, role) VALUES ($1, $2, 'user') RETURNING id, username, avatar, bio, role",
            [cleanUsername, hashedPassword],
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
        }, env.JWT_SECRET);

        // Setar JWT como cookie HttpOnly
        c.header('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=604800`);

        return createResponse(c, { user, token });
    } catch (err) {
        throw err;
    }
};

// Função: Realizar login do usuário
export const login = async (c) => {
    const env = c.env;
    try {
        const body = await c.req.json();
        const username = body.username;
        const password = body.password;

        if (!env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is not defined in environment variables.");
            return createErrorResponse(c, "INTERNAL_ERROR", "Configuration Error", 500);
        }

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

        const { valid: validPassword, needsRehash } = await compare(password, rows[0].password);

        if (!validPassword) {
            await logAudit(rows[0].id, "LOGIN_FAILED_WRONG_PASSWORD", { username }, c);
            return createErrorResponse(c, "AUTH_ERROR", "Usuário ou senha incorretos", 401);
        }

        // Migração transparente: rehash para PBKDF2 se ainda era SHA-256
        if (needsRehash) {
            c.executionCtx.waitUntil((async () => {
                try {
                    const newHash = await hash(password);
                    await queryDB("UPDATE users SET password = $1 WHERE id = $2", [newHash, rows[0].id], env);
                    console.log(`🔒 Senha do usuário ${rows[0].id} migrada para PBKDF2`);
                } catch (e) {
                    console.error("Erro ao rehash:", e.message);
                }
            })());
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
        }, env.JWT_SECRET);

        // Setar JWT como cookie HttpOnly
        c.header('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=604800`);

        return createResponse(c, {
            user,
            token
        });
    } catch (err) {
        throw err;
    }
};

// Função: Atualizar perfil do usuário
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
        let password, currentPassword, avatar, bio, email, avatarFile;

        if (contentType && contentType.includes('multipart/form-data')) {
            try {
                const formData = await c.req.formData();
                password = formData.get('password');
                currentPassword = formData.get('currentPassword');
                avatar = formData.get('avatar');
                bio = formData.get('bio');
                email = formData.get('email');
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
                email = body.email;
            } catch (e) {
                // Se o corpo estiver vazio ou não for JSON, continuamos com o que temos
            }
        }

        // Validação adicional com Zod
        const validationResult = updateProfileSchema.safeParse({
            password: password || undefined,
            avatar: (typeof avatar === 'string' ? avatar : undefined),
            bio: (typeof bio === 'string' ? bio : undefined),
            email: (typeof email === 'string' ? email : undefined)
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

            if (payload.role !== 'admin') {
                if (!currentPassword) {
                    return createErrorResponse(c, "REQUIRED_FIELD", "Senha atual é necessária para definir uma nova senha", 400);
                }

                const { valid: isMatch } = await compare(currentPassword, userRows[0].password);
                if (!isMatch) {
                    await logAudit(userId, "PASSWORD_UPDATE_FAILED_WRONG_CURRENT", {}, c);
                    return createErrorResponse(c, "AUTH_ERROR", "Senha atual incorreta", 401);
                }
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
            values.push(sanitize(bio));
        }
        if (email !== null && email !== undefined) {
            updates.push(`email = $${paramCount++}`);
            values.push(email);
        }

        if (updates.length === 0) {
            return createErrorResponse(c, "INVALID_INPUT", "Nenhum campo para atualizar", 400);
        }

        // Usar parseInt para garantir que o ID é tratado como número pelo banco
        const targetId = parseInt(userId, 10);
        values.push(targetId);

        const { rows } = await queryDB(
            `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id, username, email, avatar, bio, role`,
            values,
            env
        );

        if (rows.length === 0) {
            return createErrorResponse(c, "NOT_FOUND", "Usuário não encontrado para atualização", 404);
        }

        const decoratedUser = await getFullUser(userId, env);

        await logAudit(targetId, "USER_PROFILE_UPDATED", {
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

// Função: Marcar que o usuário descobriu os logs (Conquista Hacker)
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

// Função: Obter dados do usuário logado (via cookie JWT)
export const getMe = async (c) => {
    const env = c.env;
    try {
        const payload = c.get('jwtPayload');
        if (!payload || !payload.id) {
            return createErrorResponse(c, "UNAUTHORIZED", "Sessão inválida", 401);
        }
        const user = await getFullUser(payload.id, env);
        if (!user) {
            return createErrorResponse(c, "NOT_FOUND", "Usuário não encontrado", 404);
        }
        return createResponse(c, { user });
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", err.message, 500);
    }
};

// Função: Logout — limpa o cookie de autenticação
export const logoutUser = async (c) => {
    c.header('Set-Cookie', 'token=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0');
    return createResponse(c, { success: true, message: 'Logout realizado' });
};

// Função: Solicitar recuperação de senha
export const requestPasswordReset = async (c) => {
    const env = c.env;
    try {
        const body = await c.req.json();
        const { username } = body;

        if (!username) {
            return createErrorResponse(c, "INVALID_INPUT", "Nome de usuário é obrigatório", 400);
        }

        const { rows } = await queryDB(
            "SELECT id, username FROM users WHERE username = $1",
            [username],
            env
        );

        // Resposta genérica para não revelar se o usuário existe
        if (rows.length === 0) {
            await logAudit(null, "PASSWORD_RESET_FAILED_USER_NOT_FOUND", { username }, c);
            return createResponse(c, {
                success: true,
                message: 'Se o usuário existir, um código de recuperação foi gerado. Solicite ao administrador.'
            });
        }

        // Gerar token de reset
        const tokenBytes = new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Invalidar tokens anteriores do mesmo usuário
        await queryDB(
            "UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE",
            [rows[0].id],
            env
        );

        // Inserir novo token
        await queryDB(
            "INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)",
            [rows[0].id, token, expiresAt.toISOString()],
            env
        );

        await logAudit(rows[0].id, "PASSWORD_RESET_REQUESTED", { username }, c);

        return createResponse(c, {
            success: true,
            message: 'Código de recuperação gerado. Solicite ao administrador.',
            // Em produção com e-mail, esse token seria enviado por e-mail.
            reset_token: token
        });
    } catch (err) {
        // Auto-criar tabela se não existir
        if (err.code === '42P01') {
            await queryDB(`
                CREATE TABLE IF NOT EXISTS password_resets (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    token TEXT UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `, [], c.env);
            return createErrorResponse(c, "RETRY", "Tabela criada, tente novamente", 503);
        }
        throw err;
    }
};

// Função: Resetar senha com token
export const resetPassword = async (c) => {
    const env = c.env;
    try {
        const body = await c.req.json();
        const { token, new_password } = body;

        if (!token || !new_password) {
            return createErrorResponse(c, "INVALID_INPUT", "Token e nova senha são obrigatórios", 400);
        }

        if (new_password.length < 6) {
            return createErrorResponse(c, "INVALID_INPUT", "A nova senha deve ter pelo menos 6 caracteres", 400);
        }

        // Buscar token válido
        const { rows } = await queryDB(
            `SELECT pr.*, u.username FROM password_resets pr
             JOIN users u ON u.id = pr.user_id
             WHERE pr.token = $1 AND pr.used = FALSE AND pr.expires_at > NOW()`,
            [token],
            env
        );

        if (rows.length === 0) {
            await logAudit(null, "PASSWORD_RESET_FAILED_INVALID_TOKEN", { token: token.substring(0, 8) + '...' }, c);
            return createErrorResponse(c, "INVALID_TOKEN", "Token inválido ou expirado", 400);
        }

        const resetEntry = rows[0];

        // Atualizar senha
        const hashedPassword = await hash(new_password);
        await queryDB(
            "UPDATE users SET password = $1 WHERE id = $2",
            [hashedPassword, resetEntry.user_id],
            env
        );

        // Marcar token como usado
        await queryDB(
            "UPDATE password_resets SET used = TRUE WHERE id = $1",
            [resetEntry.id],
            env
        );

        await logAudit(resetEntry.user_id, "PASSWORD_RESET_SUCCESS", { username: resetEntry.username }, c);

        return createResponse(c, {
            success: true,
            message: 'Senha alterada com sucesso! Faça login com a nova senha.'
        });
    } catch (err) {
        throw err;
    }
};
