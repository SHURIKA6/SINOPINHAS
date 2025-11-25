const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const fs = require("fs");
const axios = require("axios"); // <--- ADICIONE ESTA LINHA
require("dotenv").config();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const app = express();
app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Origin,X-Requested-With,Content-Type,Accept,Authorization"
}));
const upload = multer({ storage: multer.memoryStorage() });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());

// Função de Inteligência: Salva IP e Ação no Banco
async function logAudit(user_id, action, meta, req) {
  try {
    // Pega o IP real, mesmo atrás de proxies do Railway/Cloudflare
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || "UNKNOWN";
    const ua = req.headers['user-agent'] || "UNKNOWN";
    const details = JSON.stringify(meta);

    // Se user_id for "anon" ou texto, converte para NULL ou trata
    const safeUserId = (typeof user_id === 'number' || (typeof user_id === 'string' && !isNaN(user_id))) 
      ? parseInt(user_id) 
      : null;

    await pool.query(
      "INSERT INTO audit_logs (user_id, action, ip, user_agent, details) VALUES ($1, $2, $3, $4, $5)",
      [safeUserId, action, ip, ua, details]
    );
  } catch (err) {
    console.error("FALHA AO GRAVAR LOG:", err.message);
  }
}
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      title TEXT,
      user_id INTEGER REFERENCES users(id),
      gdrive_id TEXT,
      likes INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      video_id INTEGER REFERENCES videos(id),
      user_id INTEGER REFERENCES users(id),
      comment TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      video_id INTEGER REFERENCES videos(id),
      user_id INTEGER REFERENCES users(id),
      reason TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS inbox (
      id SERIAL PRIMARY KEY,
      from_id INTEGER REFERENCES users(id),
      to_id INTEGER REFERENCES users(id),
      msg TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS video_reactions (
      id SERIAL PRIMARY KEY,
      video_id INTEGER REFERENCES videos(id),
      user_id INTEGER REFERENCES users(id),
      reaction TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
initDB();

// ----------- Register/Login ----------
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, avatar, bio } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Usuário e senha obrigatórios" });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password, avatar, bio) VALUES ($1, $2, $3, $4) RETURNING id, username, avatar, bio;",
      [username.toLowerCase(), hash, avatar || "", bio || ""]
    );
    logAudit(result.rows[0].id, "REGISTER", { username }, req);
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(400).json({ error: "Username já existe" });
  }
});
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const rows = await pool.query("SELECT * FROM users WHERE username = $1", [username.toLowerCase()]);
  if (!rows.rows.length) return res.status(401).json({ error: "Usuário/senha inválido" });
  const user = rows.rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Usuário/senha inválido" });
  logAudit(user.id, "LOGIN", {}, req);
  res.json({ user: { id: user.id, username: user.username, avatar: user.avatar, bio: user.bio } });
});

// ----------- Upload vídeo -----------
// --- UPLOAD COM BUNNYCDN ---
app.post('/api/upload', upload.single("file"), async (req, res) => {
  const { title, user_id } = req.body;
  const API_KEY = process.env.BUNNY_API_KEY;
  const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;

  if (!user_id || !req.file) return res.status(400).json({ error: "Arquivo obrigatório" });

  try {
    // 1. Criar o vídeo lá no BunnyCDN para pegar um ID
    const createRes = await axios.post(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
      { title: title },
      { headers: { AccessKey: API_KEY } }
    );
    const videoGuid = createRes.data.guid;

    // 2. Enviar o conteúdo do arquivo (Upload)
    await axios.put(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoGuid}`,
      req.file.buffer,
      { headers: { AccessKey: API_KEY, "Content-Type": "application/octet-stream" } }
    );

    // 3. Salvar no Banco de Dados com o ID do Bunny
    await pool.query(
      "INSERT INTO videos (title, user_id, bunny_id) VALUES ($1, $2, $3)",
      [title, parseInt(user_id), videoGuid]
    );

    logAudit(user_id, "UPLOAD_VIDEO", { title, service: "BunnyCDN" }, req);
    res.json({ success: true });

  } catch (error) {
    console.error("Erro no Upload:", error.response?.data || error.message);
    res.status(500).json({ error: "Falha ao enviar vídeo para o servidor de streaming" });
  }
});

// ----------- Listar vídeos -----------
app.get("/api/videos", async (req, res) => {
  const result = await pool.query(`
    SELECT v.*, u.username, u.avatar FROM videos v
    LEFT JOIN users u ON v.user_id = u.id
    ORDER BY v.created_at DESC LIMIT 50
  `);
  res.json(result.rows);
});

// ----------- Comentários, reações ----------
app.post("/api/comment", async (req, res) => {
  const { video_id, user_id, comment } = req.body;
  await pool.query("INSERT INTO comments (video_id, user_id, comment) VALUES ($1, $2, $3)",
    [parseInt(video_id), parseInt(user_id), comment]);
  logAudit(user_id, "COMMENT", { video_id, comment }, req);
  res.json({ ok: true });
});
app.get("/api/comments/:video_id", async (req, res) => {
  const { video_id } = req.params;
  const rows = await pool.query(
    `SELECT c.*, u.username, u.avatar FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE video_id = $1 ORDER BY c.created_at DESC LIMIT 30`, [parseInt(video_id)]);
  res.json(rows.rows);
});
app.post("/api/like", async (req, res) => {
  const { video_id, user_id } = req.body;
  await pool.query("INSERT INTO video_reactions (video_id, user_id, reaction) VALUES ($1, $2, 'like')",
    [parseInt(video_id), parseInt(user_id)]);
  logAudit(user_id, "LIKE_VIDEO", { video_id }, req);
  res.json({ ok: true });
});
app.post("/api/dislike", async (req, res) => {
  const { video_id, user_id } = req.body;
  await pool.query("INSERT INTO video_reactions (video_id, user_id, reaction) VALUES ($1, $2, 'dislike')",
    [parseInt(video_id), parseInt(user_id)]);
  logAudit(user_id, "DISLIKE_VIDEO", { video_id }, req);
  res.json({ ok: true });
});

// ----------- Denúncia -----------
app.post("/api/report", async (req, res) => {
  const { video_id, user_id, reason } = req.body;
  await pool.query("INSERT INTO reports (video_id, user_id, reason) VALUES ($1, $2, $3)",
    [parseInt(video_id), parseInt(user_id), reason]);
  logAudit(user_id, "REPORT_VIDEO", { video_id, reason }, req);
  res.json({ received: true });
});

// ----------- Mural/Inbox -----------
app.post("/api/mural", async (req, res) => {
  const { user_id, msg } = req.body;
  fs.appendFileSync("./mural.txt", `[${new Date().toISOString()}] ${user_id}: ${msg}\n`);
  logAudit(user_id, "MURAL_POST", { msg }, req);
  res.json({ ok: true });
});
app.get("/api/mural", async (req, res) => {
  const mural = fs.existsSync("./mural.txt") ? fs.readFileSync("./mural.txt", "utf8").split("\n").slice(-40) : [];
  res.json({ mural });
});
app.post("/api/send-message", async (req, res) => {
  const { from_id, to_id, msg } = req.body;
  await pool.query("INSERT INTO inbox (from_id, to_id, msg) VALUES ($1, $2, $3)",
    [parseInt(from_id), parseInt(to_id), msg]);
  logAudit(from_id, "SEND_MSG", { to_id }, req);
  res.json({ ok: true });
});
app.get("/api/inbox/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const rows = await pool.query(
    "SELECT * FROM inbox WHERE to_id = $1 OR from_id = $1 ORDER BY created_at DESC LIMIT 40",
    [parseInt(user_id)]
  );
  res.json(rows.rows);
});

// Rota Blindada para Admin ver os Logs
app.get("/api/admin/logs", async (req, res) => {
  const { admin_password } = req.query;
  if (admin_password !== process.env.ADMIN_PASSWORD && admin_password !== "admin123") {
    return res.status(403).json({ error: "Acesso Negado: Credenciais Inválidas" });
  }

  try {
    // Busca os últimos 100 registros, juntando com o nome do usuário
    const result = await pool.query(`
      SELECT a.*, u.username 
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC 
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar logs" });
  }
});

app.get("/api/search", async (req, res) => {
  const q = `%${(req.query.q || "").toLowerCase()}%`;
  const videos = await pool.query(
    `SELECT v.*, u.username FROM videos v LEFT JOIN users u ON v.user_id = u.id
     WHERE v.title ILIKE $1 OR u.username ILIKE $1
     ORDER BY v.created_at DESC LIMIT 30`, [q]);
  res.json(videos.rows);
});

app.get("/health", (_, res) => res.json({ ok: true }));
app.all("*", (req, res) => res.status(404).json({ error: "not found" }));
// --- ÁREA RESTRITA: GERENCIAMENTO DE USUÁRIOS ---
// 1. Listar Usuários
app.get("/api/admin/users", async (req, res) => {
  const { admin_password } = req.query;
  if (admin_password !== process.env.ADMIN_PASSWORD && admin_password !== "admin123") {
    return res.status(403).json({ error: "Senha de admin incorreta" });
  }
  try {
    const users = await pool.query("SELECT id, username, bio, created_at FROM users ORDER BY id DESC LIMIT 50");
    res.json(users.rows);
  } catch (err) { res.status(500).json({ error: "Erro ao listar" }); }
});
// 2. Resetar Senha (Salva-vidas)
app.post("/api/admin/reset-password", async (req, res) => {
  const { user_id, admin_password } = req.body;
  if (admin_password !== process.env.ADMIN_PASSWORD && admin_password !== "admin123") return res.status(403).send("X");
  // Define a senha padrão como "123456"
  const hash = await bcrypt.hash("123456", 10);
  await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hash, user_id]);
  res.json({ success: true });
});
// 3. Banir/Apagar Usuário (Martelo do Ban)
app.delete("/api/admin/users/:id", async (req, res) => {
  const { admin_password } = req.body;
  if (admin_password !== process.env.ADMIN_PASSWORD && admin_password !== "admin123") return res.status(403).send("X");
  const id = parseInt(req.params.id);
  try {     
    // Apaga rastro do usuário para não dar erro de chave estrangeira
    await pool.query("DELETE FROM comments WHERE user_id = $1", [id]);
    await pool.query("DELETE FROM video_reactions WHERE user_id = $1", [id]);
    await pool.query("DELETE FROM videos WHERE user_id = $1", [id]);
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao banir usuário" });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log("✅ SINOPINHAS SERVER ONLINE: login, register, upload, compliance");
});
