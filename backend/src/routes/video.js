import { Hono } from 'hono';
import { blockVPN } from '../middleware/vpn.js';
import * as videoController from '../controllers/videoController.js';

const app = new Hono();

app.post('/upload', blockVPN, videoController.uploadVideo);
app.get('/videos', videoController.listVideos);
app.get('/secret-videos', videoController.listSecretVideos);
app.delete('/videos/:id', videoController.deleteVideo);

export default app;
