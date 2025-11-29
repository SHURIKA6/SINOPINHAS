import { Hono } from "hono";
import { cors } from "hono/cors";
import { hash, compare } from "bcryptjs";

const app = new Hono();

app.use("/*", cors());

// ==========================================
// UTILITY: Consulta ao Banco de Dados
// ==========================================
async function queryDB(sql, params = [], env) {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    const result = await pool.query(sql, params);
    await pool.end();
    return result;
  } catch (err) {
    console.error("Erro no banco de dados:", err);
    throw err;
  }
}

// ==========================================
// UTILITY: Log de Auditoria FORENSE COMPLETO
// ==========================================
async function logAudit(user_id, action, meta = {}, c) {
    try {
        // CAPTURAR IP REAL (não proxy)
        const cfConnectingIP = c.req.header('CF-Connecting-IP');
        const xForwardedFor = c.req.header('X-Forwarded-For');
        const xRealIP = c.req.header('X-Real-IP');
        
        let realIP = cfConnectingIP || xRealIP || 'unknown';
        if (xForwardedFor && !cfConnectingIP) {
            realIP = xForwardedFor.split(',')[0].trim();
        }

        // GEOLOCALIZAÇÃO (Cloudflare headers)
        const cfCountry = c.req.header('CF-IPCountry') || null;
        const cfCity = c.req.header('CF-IPCity') || null;
        const cfRegion = c.req.header('CF-Region') || null;
        const cfTimezone = c.req.header('CF-Timezone') || null;
        const cfLatitude = c.req.header('CF-IPLatitude') || null;
        const cfLongitude = c.req.header('CF-IPLongitude') || null;
        const cfASN = c.req.header('CF-Connecting-ASN') || null;

        // USER AGENT
        const userAgent = c.req.header('User-Agent') || 'unknown';
        const acceptLanguage = c.req.header('Accept-Language') || null;

        // DETECTAR SISTEMA OPERACIONAL
        let os = 'Unknown';
        if (userAgent.match(/Windows NT 10\.0/i)) os = 'Windows 10';
        else if (userAgent.match(/Windows NT 11\.0/i)) os = 'Windows 11';
        else if (userAgent.match(/Windows/i)) os = 'Windows';
        else if (userAgent.match(/Mac OS X/i)) os = 'macOS';
        else if (userAgent.match(/iPhone/i)) os = 'iOS (iPhone)';
        else if (userAgent.match(/iPad/i)) os = 'iOS (iPad)';
        else if (userAgent.match(/Android/i)) os = 'Android';
        else if (userAgent.match(/Linux/i)) os = 'Linux';

        // DETECTAR NAVEGADOR
        let browser = 'Unknown';
        if (userAgent.match(/Edg\//i)) browser = 'Edge';
        else if (userAgent.match(/Chrome/i) && !userAgent.match(/Edg/i)) browser = 'Chrome';
        else if (userAgent.match(/Firefox/i)) browser = 'Firefox';
        else if (userAgent.match(/Safari/i) && !userAgent.match(/Chrome/i)) browser = 'Safari';
        else if (userAgent.match(/Opera|OPR/i)) browser = 'Opera';

        // DETECTAR TIPO DE DISPOSITIVO
        let deviceType = 'Desktop';
        if (userAgent.match(/iPhone/i)) deviceType = 'iPhone';
        else if (userAgent.match(/iPad/i)) deviceType = 'iPad';
        else if (userAgent.match(/Android.*Mobile/i)) deviceType = 'Android Mobile';
        else if (userAgent.match(/Android/i)) deviceType = 'Android Tablet';
        else if (userAgent.match(/Mobile|Tablet/i)) deviceType = 'Mobile';

        // EXTRAIR DADOS DO FINGERPRINT (com fallback seguro)
        const fingerprint = meta?.fingerprint || null;
        const screenResolution = meta?.screen || null;
        const browserLanguage = meta?.language || acceptLanguage;
        const clientTimezone = meta?.timezone || cfTimezone;

        let isp = null;
        if (cfASN) {
            isp = `ASN ${cfASN}`;
        }

        const safeUserId = (typeof user_id === 'number' || (typeof user_id === 'string' && !isNaN(user_id))) 
            ? parseInt(user_id) : null;
        
        // SALVAR NO BANCO (com try-catch interno)
        try {
            await queryDB(
                `INSERT INTO audit_logs (
                    user_id, action, ip, user_agent, details, device_type,
                    country, city, region, latitude, longitude, asn, isp,
                    browser, os, screen_resolution, language, timezone, fingerprint
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
                [
                    safeUserId, 
                    action, 
                    realIP, 
                    userAgent, 
                    JSON.stringify(meta), 
                    deviceType,
                    cfCountry,
                    cfCity,
                    cfRegion,
                    cfLatitude ? parseFloat(cfLatitude) : null,
                    cfLongitude ? parseFloat(cfLongitude) : null,
                    cfASN,
                    isp,
                    browser,
                    os,
                    screenResolution,
                    browserLanguage,
                    clientTimezone,
                    fingerprint
                ],
                c.env
            );

            console.log(`✅ LOG: ${action} | User: ${safeUserId || 'N/A'} | IP: ${realIP} | Device: ${deviceType} | Browser: ${browser} | OS: ${os}`);
        } catch (dbError) {
            console.error("❌ Erro ao salvar log no banco:", dbError.message);
        }
    } catch (err) {
        console.error("❌ FALHA GERAL AO GRAVAR LOG:", err.message);
    }
}

// ==========================================
// ROTA: Registrar aceitação dos termos
// ==========================================
app.post('/api/log-terms', async (c) => {
  try {
    const body = await c.req.json();
    await logAudit(null, 'TERMS_ACCEPTED', body, c);
    return c.json({ success: true });
  } catch (err) {
    console.error('Erro ao registrar termos:', err);
    return c.json({ error: 'Erro ao registrar' }, 500);
  }
});

// ==========================================
// ROTA: Registro de Usuário (CORRIGIDA)
// ==========================================
app.post("/api/register", async (c) => {
  const env = c.env;
  try {
    const body = await c.req.json();
    const { username, password } = body;
    
    // Extrair fingerprint de forma segura
    const fingerprintData = {
      fingerprint: body.fingerprint || null,
      screen: body.screen || null,
      language: body.language || null,
      timezone: body.timezone || null,
      fullFingerprint: body.fullFingerprint || null
    };
    
    if (!username || !password) {
      await logAudit(null, 'REGISTER_FAILED_MISSING_FIELDS', fingerprintData, c);
      return c.json({ error: "Preencha todos os campos" }, 400);
    }

    const { rows: existing } = await queryDB(
      "SELECT * FROM users WHERE username = $1",
      [username],
      env
    );

    if (existing.length > 0) {
      await logAudit(null, 'REGISTER_FAILED_USERNAME_EXISTS', { username, ...fingerprintData }, c);
      return c.json({ error: "Usuário já existe" }, 400);
    }

    const hashedPassword = await hash(password);
    const { rows } = await queryDB(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, avatar, bio",
      [username, hashedPassword],
      env
    );

    const user = rows[0];
    await logAudit(user.id, 'USER_REGISTERED', { username, ...fingerprintData }, c);
    
    console.log(`✅ Usuário criado: ${username} (ID: ${user.id})`);
    
    return c.json({ user });
  } catch (err) {
    console.error("❌ Erro ao registrar:", err);
    return c.json({ error: "Erro no servidor: " + err.message }, 500);
  }
});

// ==========================================
// ROTA: Login de Usuário (CORRIGIDA)
// ==========================================
app.post("/api/login", async (c) => {
  const env = c.env;
  try {
    const body = await c.req.json();
    const { username, password } = body;
    
    // Extrair fingerprint de forma segura
    const fingerprintData = {
      fingerprint: body.fingerprint || null,
      screen: body.screen || null,
      language: body.language || null,
      timezone: body.timezone || null,
      fullFingerprint: body.fullFingerprint || null
    };
    
    if (!username || !password) {
      await logAudit(null, 'LOGIN_FAILED_MISSING_FIELDS', fingerprintData, c);
      return c.json({ error: "Preencha todos os campos" }, 400);
    }

    const { rows } = await queryDB(
      "SELECT * FROM users WHERE username = $1",
      [username],
      env
    );

    if (rows.length === 0) {
      await logAudit(null, 'LOGIN_FAILED_USER_NOT_FOUND', { username, ...fingerprintData }, c);
      return c.json({ error: "Usuário ou senha incorretos" }, 401);
    }

    const user = rows[0];
    const validPassword = await compare(password, user.password);

    if (!validPassword) {
      await logAudit(user.id, 'LOGIN_FAILED_WRONG_PASSWORD', { username, ...fingerprintData }, c);
      return c.json({ error: "Usuário ou senha incorretos" }, 401);
    }

    await logAudit(user.id, 'USER_LOGIN_SUCCESS', { username, ...fingerprintData }, c);
    
    console.log(`✅ Login bem-sucedido: ${username} (ID: ${user.id})`);
    
    return c.json({
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (err) {
    console.error("❌ Erro ao fazer login:", err);
    return c.json({ error: "Erro no servidor: " + err.message }, 500);
  }
});

// ==========================================
// ROTA: Atualizar perfil do usuário
// ==========================================
app.put("/api/users/:id", async (c) => {
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

    await logAudit(userId, 'USER_PROFILE_UPDATED', { updates: updates.join(', ') }, c);

    return c.json(rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    return c.json({ error: "Erro no servidor" }, 500);
  }
});

// ==========================================
// ROTA: Upload de vídeo
// ==========================================
app.post("/api/upload", async (c) => {
  const env = c.env;
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const userId = formData.get("user_id");
    const isRestricted = formData.get("is_restricted") === "true";
    const thumbnail = formData.get("thumbnail");

    if (!file || !title || !userId) {
      return c.json({ error: "Faltam dados obrigatórios" }, 400);
    }

    // Upload para Google Drive
    const { default: fetch } = await import("node-fetch");
    const FormData = (await import("form-data")).default;

    const form = new FormData();
    const buffer = await file.arrayBuffer();
    form.append("file", Buffer.from(buffer), file.name);

    const uploadRes = await fetch(
      `https://sinopinhas-gdrive-upload.fernandoriga.workers.dev/upload`,
      { method: "POST", body: form }
    );

    if (!uploadRes.ok) {
      throw new Error("Falha no upload para o Google Drive");
    }

    const { fileId } = await uploadRes.json();

    let thumbnailUrl = null;
    if (thumbnail) {
      const thumbBuffer = await thumbnail.arrayBuffer();
      const thumbForm = new FormData();
      thumbForm.append("file", Buffer.from(thumbBuffer), thumbnail.name);

      const thumbRes = await fetch(
        `https://sinopinhas-gdrive-upload.fernandoriga.workers.dev/upload`,
        { method: "POST", body: thumbForm }
      );

      if (thumbRes.ok) {
        const { fileId: thumbId } = await thumbRes.json();
        thumbnailUrl = `https://drive.google.com/thumbnail?id=${thumbId}&sz=w400`;
      }
    }

    await queryDB(
      "INSERT INTO videos (title, gdrive_id, user_id, is_restricted, thumbnail_url) VALUES ($1, $2, $3, $4, $5)",
      [title, fileId, userId, isRestricted, thumbnailUrl],
      env
    );

    await logAudit(userId, 'VIDEO_UPLOADED', { title, is_restricted: isRestricted }, c);

    return c.json({ success: true, fileId });
  } catch (err) {
    console.error("Erro ao fazer upload:", err);
    return c.json({ error: "Erro ao fazer upload" }, 500);
  }
});

// ==========================================
// ROTA: Listar vídeos públicos
// ==========================================
app.get("/api/videos", async (c) => {
  const env = c.env;
  const userId = c.req.query("user_id");
  try {
    let query = `
      SELECT v.*, u.username,
      (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
      (SELECT COUNT(*) FROM views WHERE video_id = v.id) as views
    `;
    
    if (userId) {
      query += `, EXISTS(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = $1) as user_liked`;
    }
    
    query += `
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.is_restricted = false
      ORDER BY v.created_at DESC
    `;

    const { rows } = await queryDB(
      query,
      userId ? [userId] : [],
      env
    );
    return c.json(rows);
  } catch (err) {
    console.error("Erro ao buscar vídeos:", err);
    return c.json({ error: "Erro ao buscar vídeos" }, 500);
  }
});

// ==========================================
// ROTA: Listar vídeos restritos
// ==========================================
app.get("/api/secret-videos", async (c) => {
  const env = c.env;
  const userId = c.req.query("user_id");
  try {
    let query = `
      SELECT v.*, u.username,
      (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
      (SELECT COUNT(*) FROM views WHERE video_id = v.id) as views
    `;
    
    if (userId) {
      query += `, EXISTS(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = $1) as user_liked`;
    }
    
    query += `
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.is_restricted = true
      ORDER BY v.created_at DESC
    `;

    const { rows } = await queryDB(
      query,
      userId ? [userId] : [],
      env
    );
    return c.json(rows);
  } catch (err) {
    console.error("Erro ao buscar vídeos restritos:", err);
    return c.json({ error: "Erro ao buscar vídeos" }, 500);
  }
});

// ==========================================
// ROTA: Deletar vídeo
// ==========================================
app.delete("/api/videos/:id", async (c) => {
  const videoId = c.req.param("id");
  const env = c.env;
  try {
    const { userId, adminPassword } = await c.req.json();
    const isAdmin = adminPassword === env.ADMIN_PASSWORD;

    if (!isAdmin && !userId) {
      return c.json({ error: "Não autorizado" }, 403);
    }

    if (!isAdmin) {
      const { rows } = await queryDB(
        "SELECT user_id FROM videos WHERE id = $1",
        [videoId],
        env
      );

      if (rows.length === 0) {
        return c.json({ error: "Vídeo não encontrado" }, 404);
      }

      if (rows[0].user_id.toString() !== userId.toString()) {
        return c.json({ error: "Não autorizado" }, 403);
      }
    }

    await queryDB("DELETE FROM videos WHERE id = $1", [videoId], env);
    await logAudit(userId || null, 'VIDEO_DELETED', { video_id: videoId, is_admin: isAdmin }, c);
    
    return c.json({ success: true });
  } catch (err) {
    console.error("Erro ao deletar vídeo:", err);
    return c.json({ error: "Erro ao deletar vídeo" }, 500);
  }
});

// ==========================================
// ROTA: Curtir vídeo
// ==========================================
app.post("/api/videos/:id/like", async (c) => {
  const videoId = c.req.param("id");
  const env = c.env;
  try {
    const { user_id } = await c.req.json();

    const { rows: existing } = await queryDB(
      "SELECT * FROM likes WHERE video_id = $1 AND user_id = $2",
      [videoId, user_id],
      env
    );

    if (existing.length > 0) {
      await queryDB(
        "DELETE FROM likes WHERE video_id = $1 AND user_id = $2",
        [videoId, user_id],
        env
      );
    } else {
      await queryDB(
        "INSERT INTO likes (video_id, user_id) VALUES ($1, $2)",
        [videoId, user_id],
        env
      );
    }

    return c.json({ success: true });
  } catch (err) {
    console.error("Erro ao curtir vídeo:", err);
    return c.json({ error: "Erro ao curtir vídeo" }, 500);
  }
});

// ==========================================
// ROTA: Registrar visualização
// ==========================================
app.post("/api/videos/:id/view", async (c) => {
  const videoId = c.req.param("id");
  const env = c.env;
  try {
    const { user_id } = await c.req.json();

    await queryDB(
      "INSERT INTO views (video_id, user_id) VALUES ($1, $2)",
      [videoId, user_id],
      env
    );

    return c.json({ success: true });
  } catch (err) {
    console.error("Erro ao registrar view:", err);
    return c.json({ error: "Erro ao registrar view" }, 500);
  }
});

// ==========================================
// ROTA: Adicionar comentário
// ==========================================
app.post("/api/comment", async (c) => {
  const env = c.env;
  try {
    const { video_id, user_id, comment } = await c.req.json();

    if (!comment || !comment.trim()) {
      return c.json({ error: "Comentário vazio" }, 400);
    }

    await queryDB(
      "INSERT INTO comments (video_id, user_id, comment) VALUES ($1, $2, $3)",
      [video_id, user_id, comment],
      env
    );

    const { rows: video } = await queryDB(
      "SELECT user_id FROM videos WHERE id = $1",
      [video_id],
      env
    );

    if (video.length > 0 && video[0].user_id !== user_id) {
      await queryDB(
        "INSERT INTO notifications (user_id, type, related_id, message) VALUES ($1, $2, $3, $4)",
        [video[0].user_id, "comment", video_id, "Novo comentário no seu vídeo"],
        env
      );
    }

    return c.json({ success: true });
  } catch (err) {
    console.error("Erro ao adicionar comentário:", err);
    return c.json({ error: "Erro ao adicionar comentário" }, 500);
  }
});

// ==========================================
// ROTA: Buscar comentários
// ==========================================
app.get("/api/comments/:videoId", async (c) => {
  const videoId = c.req.param("videoId");
  const env = c.env;
  try {
    const { rows } = await queryDB(
      `SELECT c.*, u.username, u.avatar 
       FROM comments c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.video_id = $1 
       ORDER BY c.created_at DESC`,
      [videoId],
      env
    );
    return c.json(rows);
  } catch (err) {
    console.error("Erro ao buscar comentários:", err);
    return c.json({ error: "Erro ao buscar comentários" }, 500);
  }
});

// ==========================================
// ROTA: Deletar comentário
// ==========================================
app.delete("/api/comments/:id", async (c) => {
  const commentId = c.req.param("id");
  const env = c.env;
  try {
    const { user_id, admin_password } = await c.req.json();
    const isAdmin = admin_password === env.ADMIN_PASSWORD;

    if (!isAdmin) {
      const { rows } = await queryDB(
        "SELECT user_id FROM comments WHERE id = $1",
        [commentId],
        env
      );

      if (rows.length === 0 || rows[0].user_id !== user_id) {
        return c.json({ error: "Não autorizado" }, 403);
      }
    }

    await queryDB("DELETE FROM comments WHERE id = $1", [commentId], env);
    return c.json({ success: true });
  } catch (err) {
    console.error("Erro ao deletar comentário:", err);
    return c.json({ error: "Erro ao deletar comentário" }, 500);
  }
});

// ==========================================
// ROTA: Buscar notificações
// ==========================================
app.get("/api/notifications/:userId", async (c) => {
  const userId = c.req.param("userId");
  const env = c.env;
  try {
    const { rows } = await queryDB(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [userId],
      env
    );
    return c.json(rows);
  } catch (err) {
    console.error("Erro ao buscar notificações:", err);
    return c.json({ error: "Erro ao buscar notificações" }, 500);
  }
});

// ==========================================
// ROTA: Buscar todos os usuários (para inbox)
// ==========================================
app.get("/api/users/all", async (c) => {
    const env = c.env;

    try {
        const { rows } = await queryDB(
            "SELECT id, username, avatar, bio FROM users ORDER BY username ASC",
            [],
            env
        );
        return c.json(rows);
    } catch (err) {
        console.error("Erro ao listar usuários:", err);
        return c.json({ error: "Erro ao listar usuários" }, 500);
    }
});

// ==========================================
// ROTA: Enviar mensagem
// ==========================================
app.post("/api/send-message", async (c) => {
  const env = c.env;
  try {
    const { from_id, to_id, msg } = await c.req.json();

    await queryDB(
      "INSERT INTO messages (from_id, to_id, msg) VALUES ($1, $2, $3)",
      [from_id, to_id, msg],
      env
    );

    return c.json({ success: true });
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    return c.json({ error: "Erro ao enviar mensagem" }, 500);
  }
});

// ==========================================
// ROTA: Buscar mensagens
// ==========================================
app.get("/api/inbox/:userId", async (c) => {
  const userId = c.req.param("userId");
  const env = c.env;
  try {
    const { rows } = await queryDB(
      `SELECT m.*, 
        uf.username as from_username, uf.avatar as from_avatar,
        ut.username as to_username, ut.avatar as to_avatar
       FROM messages m
       LEFT JOIN users uf ON m.from_id = uf.id
       LEFT JOIN users ut ON m.to_id = ut.id
       WHERE m.from_id = $1 OR m.to_id = $1
       ORDER BY m.created_at ASC`,
      [userId],
      env
    );
    return c.json(rows);
  } catch (err) {
    console.error("Erro ao buscar mensagens:", err);
    return c.json({ error: "Erro ao buscar mensagens" }, 500);
  }
});

// ==========================================
// ADMIN: Login
// ==========================================
app.post("/api/admin/login", async (c) => {
  const env = c.env;
  try {
    const { password } = await c.req.json();
    
    if (password === env.ADMIN_PASSWORD) {
      await logAudit(null, 'ADMIN_LOGIN_SUCCESS', {}, c);
      return c.json({ success: true });
    }
    
    await logAudit(null, 'ADMIN_LOGIN_FAILED', {}, c);
    return c.json({ error: "Senha incorreta" }, 401);
  } catch (err) {
    console.error("Erro no login admin:", err);
    return c.json({ error: "Erro no servidor" }, 500);
  }
});

// ==========================================
// ADMIN: Listar usuários
// ==========================================
app.get("/api/admin/users", async (c) => {
  const env = c.env;
  const adminPassword = c.req.query("admin_password");

  if (adminPassword !== env.ADMIN_PASSWORD) {
    return c.json({ error: "Não autorizado" }, 403);
  }

  try {
    const { rows } = await queryDB(
      "SELECT id, username, created_at FROM users ORDER BY created_at DESC",
      [],
      env
    );
    return c.json(rows);
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    return c.json({ error: "Erro ao listar usuários" }, 500);
  }
});

// ==========================================
// ADMIN: Resetar senha
// ==========================================
app.post("/api/admin/reset-password", async (c) => {
  const env = c.env;
  try {
    const { user_id, admin_password } = await c.req.json();

    if (admin_password !== env.ADMIN_PASSWORD) {
      return c.json({ error: "Não autorizado" }, 403);
    }

    const hashedPassword = await hash("123456");
    await queryDB(
      "UPDATE users SET password = $1 WHERE id = $2",
      [hashedPassword, user_id],
      env
    );

    await logAudit(null, 'ADMIN_PASSWORD_RESET', { target_user_id: user_id }, c);

    return c.json({ success: true });
  } catch (err) {
    console.error("Erro ao resetar senha:", err);
    return c.json({ error: "Erro ao resetar senha" }, 500);
  }
});

// ==========================================
// ADMIN: Banir usuário
// ==========================================
app.delete("/api/admin/users/:userId", async (c) => {
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

    await logAudit(null, 'ADMIN_USER_BANNED', { target_user_id: userId }, c);

    return c.json({ success: true });
  } catch (err) {
    console.error("Erro ao banir usuário:", err);
    return c.json({ error: "Erro ao banir usuário" }, 500);
  }
});

// ==========================================
// ADMIN: Buscar logs de auditoria
// ==========================================
app.get("/api/admin/logs", async (c) => {
  const env = c.env;
  const adminPassword = c.req.query("admin_password");

  if (adminPassword !== env.ADMIN_PASSWORD) {
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
    return c.json(rows);
  } catch (err) {
    console.error("Erro ao buscar logs:", err);
    return c.json({ error: "Erro ao buscar logs" }, 500);
  }
});

export default app;
// =====================================================================