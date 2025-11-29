import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use("/*", cors());

// ==========================================
// UTILITY: Hash e Compare (SEM BCRYPTJS)
// ==========================================
async function hash(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'SINOPINHAS_SALT_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function compare(password, hashedPassword) {
  const computedHash = await hash(password);
  return computedHash === hashedPassword;
}

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
    console.error("❌ Erro no banco de dados:", err);
    throw err;
  }
}

// ==========================================
// UTILITY: Log de Auditoria FORENSE COMPLETO
// ==========================================
async function logAudit(user_id, action, meta = {}, c) {
    try {
        // CAPTURAR IP REAL
        const cfConnectingIP = c.req.header('CF-Connecting-IP');
        const xForwardedFor = c.req.header('X-Forwarded-For');
        const xRealIP = c.req.header('X-Real-IP');
        
        let realIP = cfConnectingIP || xRealIP || 'unknown';
        if (xForwardedFor && !cfConnectingIP) {
            realIP = xForwardedFor.split(',')[0].trim();
        }

        // GEOLOCALIZAÇÃO
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

        // EXTRAIR FINGERPRINT
        const fingerprint = meta?.fingerprint || null;
        const screenResolution = meta?.screen || null;
        const browserLanguage = meta?.language || acceptLanguage;
        const clientTimezone = meta?.timezone || cfTimezone;

        let isp = null;
        if (cfASN) {
            isp = `ASN ${cfASN}`;
        }

        const safeUserId = user_id ? parseInt(user_id) : null;

        // SALVAR NO BANCO (VERSÃO COMPLETA)
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

            console.log(`✅ LOG COMPLETO: ${action} | User: ${safeUserId || 'N/A'} | IP: ${realIP} | Browser: ${browser} | OS: ${os} | Fingerprint: ${fingerprint ? fingerprint.substring(0, 8) : 'N/A'}`);
        } catch (dbError) {
            console.error("⚠️ Erro ao salvar log no banco:", dbError.message);
            
            // FALLBACK: Tentar salvar apenas básico
            try {
                await queryDB(
                    `INSERT INTO audit_logs (
                        user_id, action, ip, user_agent, details, device_type
                    ) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        safeUserId, 
                        action, 
                        realIP, 
                        userAgent, 
                        JSON.stringify(meta), 
                        deviceType
                    ],
                    c.env
                );
                console.log(`⚠️ LOG BÁSICO salvo: ${action}`);
            } catch (fallbackError) {
                console.error("❌ Falha total ao salvar log:", fallbackError.message);
            }
        }
    } catch (err) {
        console.error("⚠️ Falha ao gravar log (não crítico):", err.message);
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
    console.error('❌ Erro ao registrar termos:', err);
    return c.json({ error: 'Erro ao registrar' }, 500);
  }
});

// ==========================================
// ROTA: Registro de Usuário
// ==========================================
app.post("/api/register", async (c) => {
  const env = c.env;
  try {
    const body = await c.req.json();
    console.log('📦 Body recebido no registro:', JSON.stringify(body, null, 2));
    
    const username = body.username;
    const password = body.password;
    
    if (!username || !password) {
      console.log('❌ Campos vazios');
      await logAudit(null, 'REGISTER_FAILED_MISSING_FIELDS', body, c);
      return c.json({ error: "Preencha todos os campos" }, 400);
    }

    console.log(`🔍 Verificando se "${username}" existe...`);
    const { rows: existing } = await queryDB(
      "SELECT * FROM users WHERE username = $1",
      [username],
      env
    );

    if (existing.length > 0) {
      console.log(`❌ Usuário "${username}" já existe`);
      await logAudit(null, 'REGISTER_FAILED_USERNAME_EXISTS', { username, ...body }, c);
      return c.json({ error: "Usuário já existe" }, 400);
    }

    console.log('🔐 Gerando hash da senha...');
    const hashedPassword = await hash(password);
    
    console.log('💾 Inserindo usuário no banco...');
    const { rows } = await queryDB(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, avatar, bio",
      [username, hashedPassword],
      env
    );

    const user = rows[0];
    console.log(`✅ Usuário criado com sucesso: ${username} (ID: ${user.id})`);
    
    try {
      await logAudit(user.id, 'USER_REGISTERED', body, c);
    } catch (logErr) {
      console.error('⚠️ Erro ao salvar log (não crítico):', logErr.message);
    }
    
    return c.json({ user });
  } catch (err) {
    console.error("❌ ERRO CRÍTICO AO REGISTRAR:", err);
    console.error("Stack trace:", err.stack);
    return c.json({ error: "Erro no servidor: " + err.message }, 500);
  }
});

// ==========================================
// ROTA: Login de Usuário
// ==========================================
app.post("/api/login", async (c) => {
  const env = c.env;
  try {
    const body = await c.req.json();
    console.log('📦 Body recebido no login:', JSON.stringify(body, null, 2));
    
    const username = body.username;
    const password = body.password;
    
    if (!username || !password) {
      console.log('❌ Campos vazios no login');
      await logAudit(null, 'LOGIN_FAILED_MISSING_FIELDS', body, c);
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
      await logAudit(null, 'LOGIN_FAILED_USER_NOT_FOUND', { username, ...body }, c);
      return c.json({ error: "Usuário ou senha incorretos" }, 401);
    }

    const user = rows[0];
    console.log(`🔐 Verificando senha para usuário ID: ${user.id}`);
    const validPassword = await compare(password, user.password);

    if (!validPassword) {
      console.log(`❌ Senha incorreta para usuário: ${username}`);
      await logAudit(user.id, 'LOGIN_FAILED_WRONG_PASSWORD', { username, ...body }, c);
      return c.json({ error: "Usuário ou senha incorretos" }, 401);
    }

    console.log(`✅ Login bem-sucedido: ${username} (ID: ${user.id})`);
    
    try {
      await logAudit(user.id, 'USER_LOGIN_SUCCESS', body, c);
    } catch (logErr) {
      console.error('⚠️ Erro ao salvar log (não crítico):', logErr.message);
    }
    
    return c.json({
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (err) {
    console.error("❌ ERRO CRÍTICO AO FAZER LOGIN:", err);
    console.error("Stack trace:", err.stack);
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
    console.log(`✅ Perfil atualizado: User ID ${userId}`);

    return c.json(rows[0]);
  } catch (err) {
    console.error("❌ Erro ao atualizar perfil:", err);
    return c.json({ error: "Erro no servidor" }, 500);
  }
});

// ==========================================
// ROTA: Upload de vídeo PARA BUNNY CDN (CORRIGIDO v2)
// ==========================================
app.post("/api/upload", async (c) => {
  const env = c.env;
  try {
    console.log('📤 Iniciando upload para Bunny CDN...');
    
    const formData = await c.req.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const userId = formData.get("user_id");
    const isRestricted = formData.get("is_restricted") === "true";

    if (!file || !title || !userId) {
      console.log('❌ Faltam dados obrigatórios');
      return c.json({ error: "Faltam dados obrigatórios" }, 400);
    }

    console.log(`📤 Upload: "${title}" (${file.size} bytes)`);
    console.log(`🔑 BUNNY_API_KEY existe: ${!!env.BUNNY_API_KEY}`);
    console.log(`📚 BUNNY_LIBRARY_ID: ${env.BUNNY_LIBRARY_ID}`);

    // ✅ CRIAR VÍDEO NO BUNNY (TESTANDO AMBOS FORMATOS DE AUTH)
    const createVideoRes = await fetch(
      `https://video.bunnycdn.com/library/${env.BUNNY_LIBRARY_ID}/videos`,
      {
        method: "POST",
        headers: {
          "AccessKey": env.BUNNY_API_KEY,  // ← Formato 1
          "Authorization": `Bearer ${env.BUNNY_API_KEY}`,  // ← Formato 2 (backup)
          "accept": "application/json",
          "content-type": "application/json"
        },
        body: JSON.stringify({ 
          title: title
        })
      }
    );

    const responseText = await createVideoRes.text();
    console.log(`📡 Resposta Bunny (${createVideoRes.status}):`, responseText.substring(0, 200));

    if (!createVideoRes.ok) {
      throw new Error(`Bunny retornou ${createVideoRes.status}: ${responseText}`);
    }

    const videoData = JSON.parse(responseText);
    const videoGuid = videoData.guid;
    console.log(`✅ Vídeo criado: ${videoGuid}`);

    // ✅ UPLOAD DO ARQUIVO
    const buffer = await file.arrayBuffer();
    const uploadRes = await fetch(
      `https://video.bunnycdn.com/library/${env.BUNNY_LIBRARY_ID}/videos/${videoGuid}`,
      {
        method: "PUT",
        headers: {
          "AccessKey": env.BUNNY_API_KEY
        },
        body: buffer
      }
    );

    console.log(`📡 Upload status: ${uploadRes.status}`);

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      throw new Error(`Falha no upload: ${errorText}`);
    }

    // ✅ SALVAR NO BANCO
    await queryDB(
      "INSERT INTO videos (title, bunny_id, user_id, is_restricted) VALUES ($1, $2, $3, $4)",
      [title, videoGuid, userId, isRestricted],
      env
    );

    await logAudit(userId, 'VIDEO_UPLOADED', { title, is_restricted: isRestricted }, c);
    console.log(`✅ SUCESSO TOTAL!`);

    return c.json({ success: true, bunny_id: videoGuid });
  } catch (err) {
    console.error("❌ ERRO:", err.message);
    console.error("Stack:", err.stack);
    return c.json({ 
      error: "Erro ao fazer upload",
      details: err.message
    }, 500);
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
    
    console.log(`✅ Listados ${rows.length} vídeos públicos`);
    return c.json(rows);
  } catch (err) {
    console.error("❌ Erro ao buscar vídeos:", err);
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
    
    console.log(`✅ Listados ${rows.length} vídeos restritos`);
    return c.json(rows);
  } catch (err) {
    console.error("❌ Erro ao buscar vídeos restritos:", err);
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
    console.log(`✅ Vídeo deletado: ID ${videoId}`);
    
    return c.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao deletar vídeo:", err);
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
      console.log(`💔 Like removido: Vídeo ${videoId} por User ${user_id}`);
    } else {
      await queryDB(
        "INSERT INTO likes (video_id, user_id) VALUES ($1, $2)",
        [videoId, user_id],
        env
      );
      console.log(`❤️ Like adicionado: Vídeo ${videoId} por User ${user_id}`);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao curtir vídeo:", err);
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

    console.log(`👁️ View registrada: Vídeo ${videoId} por User ${user_id}`);
    return c.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao registrar view:", err);
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

    console.log(`💬 Comentário adicionado: Vídeo ${video_id} por User ${user_id}`);
    return c.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao adicionar comentário:", err);
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
    
    console.log(`✅ Listados ${rows.length} comentários do vídeo ${videoId}`);
    return c.json(rows);
  } catch (err) {
    console.error("❌ Erro ao buscar comentários:", err);
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
    console.log(`✅ Comentário deletado: ID ${commentId}`);
    
    return c.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao deletar comentário:", err);
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
    
    console.log(`✅ Listadas ${rows.length} notificações do User ${userId}`);
    return c.json(rows);
  } catch (err) {
    console.error("❌ Erro ao buscar notificações:", err);
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
        
        console.log(`✅ Listados ${rows.length} usuários`);
        return c.json(rows);
    } catch (err) {
        console.error("❌ Erro ao listar usuários:", err);
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

    console.log(`📨 Mensagem enviada: De User ${from_id} para User ${to_id}`);
    return c.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao enviar mensagem:", err);
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
    
    console.log(`✅ Listadas ${rows.length} mensagens do User ${userId}`);
    return c.json(rows);
  } catch (err) {
    console.error("❌ Erro ao buscar mensagens:", err);
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
      console.log('✅ Admin login bem-sucedido');
      return c.json({ success: true });
    }
    
    await logAudit(null, 'ADMIN_LOGIN_FAILED', {}, c);
    console.log('❌ Admin login falhou - senha incorreta');
    return c.json({ error: "Senha incorreta" }, 401);
  } catch (err) {
    console.error("❌ Erro no login admin:", err);
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
    console.log('❌ Tentativa de acesso admin não autorizado');
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
    console.log(`✅ Admin resetou senha do User ${user_id}`);

    return c.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao resetar senha:", err);
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
    console.log(`✅ Admin baniu User ${userId}`);

    return c.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao banir usuário:", err);
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
    console.log('❌ Tentativa de acesso aos logs não autorizada');
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
});

// ==========================================
// ROTA: Health Check
// ==========================================
app.get("/", (c) => {
  return c.json({ 
    status: "online", 
    service: "SINOPINHAS Backend API",
    version: "2.0",
    timestamp: new Date().toISOString()
  });
});

export default app;
