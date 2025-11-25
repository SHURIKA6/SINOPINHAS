const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const fs = require("fs");
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

function logAudit(user_id, action, meta, req) {
  const log = {
    time: new Date().toISOString(),
    user_id: user_id || "anon",
    action,
    meta,
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || "???",
    ua: req.headers['user-agent']
  };
  fs.appendFileSync("./audit.log", JSON.stringify(log) + "\n");
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
app.post('/api/upload', upload.single("file"), async (req, res) => {
  const { title, user_id, gdrive_id } = req.body;
  if (!user_id || !(gdrive_id || req.file)) return res.status(400).json({ error: "Preencha todos os campos" });
  await pool.query("INSERT INTO videos (title, user_id, gdrive_id) VALUES ($1, $2, $3)",
    [title, parseInt(user_id), gdrive_id || null]);
  logAudit(user_id, "UPLOAD_VIDEO", { title, by_file: !!req.file }, req);
  res.json({ success: true });
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

// ----------- Admin/login/auditlog -----------
app.post('/api/admin/login', async (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) return res.json({ success: true });
  res.status(401).json({ error: "Senha errada" });
});
app.get("/api/admin/auditlog", (req, res) => {
  if (req.query.admin_password !== ADMIN_PASSWORD) return res.status(403).send("forbidden");
  const logs = fs.existsSync("./audit.log")
    ? fs.readFileSync("./audit.log", "utf8").split("\n").slice(-100).reverse()
    : [];
  res.json({ logs });
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

app.listen(process.env.PORT || 3001, () => {
  console.log("✅ SINOPINHAS SERVER ONLINE: login, register, upload, compliance");
});
