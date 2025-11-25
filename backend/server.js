const express = require('express')
const cors = require('cors')
const multer = require('multer')
const axios = require('axios')
const { Pool } = require('pg')
const bcrypt = require('bcrypt')
require('dotenv').config()

const app = express()
const upload = multer({ storage: multer.memoryStorage() })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

app.use(cors())
app.use(express.json())

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

app.use((req, res, next) => {
  req.client_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  next()
})

app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true, isAdmin: true })
    } else {
      res.status(401).json({ error: 'Senha admin incorreta' })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/admin/users', async (req, res) => {
  try {
    const { adminPassword } = req.body
    if (adminPassword !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Sem permissão' })
    const result = await pool.query(`
      SELECT u.id, u.username, u.created_at, COUNT(v.id) as video_count
      FROM users u
      LEFT JOIN videos v ON v.owner_id = u.id::text
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/admin/reset-password', async (req, res) => {
  try {
    const { adminPassword, userId } = req.body
    if (adminPassword !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Sem permissão' })
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId])
    res.json({ success: true, tempPassword })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/admin/delete-user', async (req, res) => {
  try {
    const { adminPassword, userId } = req.body
    if (adminPassword !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Sem permissão' })
    const videos = await pool.query('SELECT * FROM videos WHERE owner_id = $1', [userId.toString()])
    for (const video of videos.rows) {
      try {
        await axios.delete(
          `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${video.bunny_id}`,
          { headers: { AccessKey: process.env.BUNNY_API_KEY } }
        )
      } catch {}
    }
    await pool.query('DELETE FROM videos WHERE owner_id = $1', [userId.toString()])
    await pool.query('DELETE FROM users WHERE id = $1', [userId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Username e password são obrigatórios' })
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await pool.query('INSERT INTO users (username, password, ip_registro) VALUES ($1, $2, $3) RETURNING id, username', 
      [username.toLowerCase(), hashedPassword, req.client_ip])
    res.json({ success: true, user: result.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username já existe' })
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()])
    if (result.rows.length === 0) return res.status(401).json({ error: 'Usuário ou senha incorretos' })
    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Usuário ou senha incorretos' })
    await pool.query('INSERT INTO logs (user_id, action, ip, time) VALUES ($1, $2, $3, NOW())', [user.id, 'login', req.client_ip])
    res.json({ success: true, user: { id: user.id, username: user.username } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/videos', async (req, res) => {
  try {
    const result = await pool.query('SELECT v.*, u.username FROM videos v LEFT JOIN users u ON v.owner_id = u.id::text ORDER BY v.created_at DESC')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, userId } = req.body
    if (!userId) return res.status(401).json({ error: 'Você precisa estar logado' })
    const createRes = await axios.post(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos`,
      { title },
      { headers: { AccessKey: process.env.BUNNY_API_KEY } }
    )
    const videoId = createRes.data.guid
    await axios.put(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${videoId}`,
      req.file.buffer,
      { headers: { AccessKey: process.env.BUNNY_API_KEY, 'Content-Type': 'application/octet-stream' } }
    )
    await pool.query('INSERT INTO videos (bunny_id, title, owner_id, ip_envio) VALUES ($1, $2, $3, $4)', [videoId, title, userId, req.client_ip])
    await pool.query('INSERT INTO logs (user_id, action, ip, time) VALUES ($1, $2, $3, NOW())', [userId, 'upload', req.client_ip])
    res.json({ success: true, videoId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { userId } = req.body
    const result = await pool.query('SELECT * FROM videos WHERE id = $1', [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vídeo não encontrado' })
    const video = result.rows[0]
    if (video.owner_id !== userId) return res.status(403).json({ error: 'Sem permissão' })
    await axios.delete(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${video.bunny_id}`,
      { headers: { AccessKey: process.env.BUNNY_API_KEY } }
    )
    await pool.query('DELETE FROM videos WHERE id = $1', [id])
    await pool.query('INSERT INTO logs (user_id, action, ip, time) VALUES ($1, $2, $3, NOW())', [userId, 'delete_video', req.client_ip])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`✅ Backend rodando na porta ${PORT}`)
})
