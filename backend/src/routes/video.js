import { Hono } from 'hono';
import { blockVPN } from '../middleware/vpn.js';
import * as videoController from '../controllers/videoController.js';

const app = new Hono();

// Search routes
app.get('/videos/search', videoController.searchVideos);
app.get('/videos/:id', videoController.getVideo);

// Existing routes (Restored)
app.post('/upload', blockVPN, videoController.uploadVideo); // /api/upload
app.get('/videos', videoController.listVideos); // /api/videos
app.get('/secret-videos', videoController.listSecretVideos); // /api/secret-videos
app.delete('/videos/:id', videoController.deleteVideo); // /api/videos/:id

export default app;
