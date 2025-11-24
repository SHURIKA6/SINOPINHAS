require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const multer = require('multer');

// multer guarda o arquivo em memória (buffer)
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

// conexão com Supabase Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// inicializar tabela
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      bunny_id VARCHAR(100),
      thumbnail_url VARCHAR(500),
      views INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
};

initDB().catch((err) => {
  console.error('Erro ao inicializar o banco:', err);
});

// rota de teste opcional
app.get('/api/upload', (req, res) => {
  res.json({ ok: true, method: 'GET', message: 'Rota /api/upload está de pé (GET de teste)' });
});

// rota: listar vídeos DIRETO da Bunny (sempre sincronizado)
app.get('/api/videos', async (req, res) => {
  try {
    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const apiKey = process.env.BUNNY_API_KEY;

    // Busca vídeos da Bunny Stream API
    const response = await axios.get(
      `https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=100&orderBy=date`,
      {
        headers: {
          AccessKey: apiKey,
          Accept: 'application/json'
        }
      }
    );

    // Mapeia para o formato que o frontend espera
    const videos = response.data.items.map((v) => ({
      id: v.guid,
      title: v.title,
      bunny_id: v.guid,
      thumbnail_url: `https://${process.env.BUNNY_HOSTNAME}/${v.guid}/thumbnail.jpg`,
      views: v.views || 0,
      created_at: v.dateUploaded
    }));

    res.json(videos);
  } catch (err) {
    console.error('Erro ao listar vídeos da Bunny:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao listar vídeos' });
  }
});

// rota: salvar metadados direto (caso precise usar separado)
app.post('/api/videos', async (req, res) => {
  try {
    const { title, bunny_id, thumbnail_url } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO videos(title, bunny_id, thumbnail_url) VALUES($1, $2, $3) RETURNING *',
      [title, bunny_id, thumbnail_url || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar vídeo' });
  }
});

// rota: backend faz upload REAL do arquivo para a Bunny
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const title = req.body.title || (req.file && req.file.originalname);
    const fileBuffer = req.file && req.file.buffer;

    if (!title || !fileBuffer) {
      return res.status(400).json({ error: 'title e arquivo são obrigatórios' });
    }

    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const apiKey = process.env.BUNNY_API_KEY;

    // 1. Criar o objeto de vídeo na Bunny (metadados)
    const createRes = await axios.post(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      { title },
      {
        headers: {
          AccessKey: apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    const bunny = createRes.data; // contém bunny.guid

    // 2. Enviar o arquivo binário para a Bunny
    await axios.put(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${bunny.guid}`,
      fileBuffer,
      {
        headers: {
          AccessKey: apiKey,
          'Content-Type': 'application/octet-stream'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    // 3. Montar thumbnail e salvar no Postgres (opcional, já que agora buscamos da Bunny)
    const thumb = `https://${process.env.BUNNY_HOSTNAME}/${bunny.guid}/thumbnail.jpg`;

    await pool.query(
      'INSERT INTO videos(title, bunny_id, thumbnail_url) VALUES($1, $2, $3)',
      [title, bunny.guid, thumb]
    );

    res.json({ success: true, bunny_id: bunny.guid });
  } catch (err) {
    console.error('Erro upload Bunny:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Erro ao fazer upload para a Bunny',
      detail: err.response?.data || err.message
    });
  }
});

// iniciar servidor
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log('Backend rodando na porta ' + port);
});
