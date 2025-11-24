const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// Criar tabela de usuários (se não existir)
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};
initDB();

// Registrar usuário
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username.toLowerCase(), hashedPassword]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username já existe' });
    }
    console.error('Error registering:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }

    res.json({ 
      success: true, 
      user: { id: user.id, username: user.username } 
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: err.message });
  }
});

// Listar vídeos
app.get('/api/videos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, u.username 
      FROM videos v 
      LEFT JOIN users u ON v.owner_id = u.id::text
      ORDER BY v.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ error: err.message });
  }
});

// Upload de vídeo (requer autenticação)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, userId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Você precisa estar logado para enviar vídeos' });
    }

    const createRes = await axios.post(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos`,
      { title },
      { headers: { AccessKey: process.env.BUNNY_API_KEY } }
    );

    const videoId = createRes.data.guid;

    await axios.put(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${videoId}`,
      req.file.buffer,
      {
        headers: {
          AccessKey: process.env.BUNNY_API_KEY,
          'Content-Type': 'application/octet-stream'
        }
      }
    );

    await pool.query(
      'INSERT INTO videos (bunny_id, title, owner_id) VALUES ($1, $2, $3)',
      [videoId, title, userId]
    );

    res.json({ success: true, videoId });
  } catch (err) {
    console.error('Error uploading video:', err);
    res.status(500).json({ error: err.message });
  }
});

// Deletar vídeo
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const result = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    const video = result.rows[0];

    if (video.owner_id !== userId) {
      return res.status(403).json({ error: 'Sem permissão para deletar' });
    }

    await axios.delete(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${video.bunny_id}`,
      { headers: { AccessKey: process.env.BUNNY_API_KEY } }
    );

    await pool.query('DELETE FROM videos WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting video:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend rodando na porta ${PORT}`);
});
