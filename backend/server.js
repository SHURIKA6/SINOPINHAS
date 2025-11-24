const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());

// Listar vídeos
app.get('/api/videos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM videos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ error: err.message });
  }
});

// Upload de vídeo
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { title } = req.body;
    const ownerId = req.body.ownerId || 'anonymous';

    // Cria vídeo na Bunny
    const createRes = await axios.post(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos`,
      { title },
      { headers: { AccessKey: process.env.BUNNY_API_KEY } }
    );

    const videoId = createRes.data.guid;

    // Faz upload do arquivo
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

    // Salva no banco
    await pool.query(
      'INSERT INTO videos (bunny_id, title, owner_id) VALUES ($1, $2, $3)',
      [videoId, title, ownerId]
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
    const { ownerId } = req.body;

    // Busca o vídeo
    const result = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    const video = result.rows[0];

    // Verifica permissão (admin ou dono)
    const isAdmin = ownerId === 'admin_master';
    const isOwner = video.owner_id === ownerId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Sem permissão para deletar' });
    }

    // Deleta da Bunny
    await axios.delete(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${video.bunny_id}`,
      { headers: { AccessKey: process.env.BUNNY_API_KEY } }
    );

    // Deleta do banco
    await pool.query('DELETE FROM videos WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting video:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend rodando na porta ${PORT}`);
});
