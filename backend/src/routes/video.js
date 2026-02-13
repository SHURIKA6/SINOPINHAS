import { Hono } from 'hono';
import { blockVPN } from '../middleware/vpn.js';
import { authMiddleware } from '../middleware/auth.js';
import { limiter } from '../middleware/rateLimit.js'; // Added limiter import
import * as videoController from '../controllers/videoController.js';

const app = new Hono();

// Rotas: Pesquisa de Vídeos
app.get('/videos/search', videoController.searchVideos);
app.get('/videos/:id', videoController.getVideo);

// Rotas Protegidas
app.post('/upload', authMiddleware, blockVPN, limiter(3, 300), videoController.uploadVideo); // Added limiter middleware
app.delete('/videos/:id', authMiddleware, videoController.deleteVideo); // /api/videos/:id

// Rotas Públicas
app.get('/videos', videoController.listVideos); // /api/videos
app.get('/secret-videos', authMiddleware, videoController.listSecretVideos); // /api/secret-videos (protegido)

export default app;
