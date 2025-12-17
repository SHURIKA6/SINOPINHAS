```javascript
import { Hono } from 'hono';
import { blockVPN } from '../middleware/vpn.js';
import { authMiddleware } from '../middleware/auth.js';
import { limiter } from '../middleware/rateLimit.js'; // Added limiter import
import * as videoController from '../controllers/videoController.js';

const app = new Hono();

// Search routes
app.get('/videos/search', videoController.searchVideos);
app.get('/videos/:id', videoController.getVideo);

// Protected Routes
app.post('/upload', authMiddleware, blockVPN, limiter(3, 300), videoController.uploadVideo); // Added limiter middleware
app.delete('/videos/:id', authMiddleware, videoController.deleteVideo); // /api/videos/:id

// Public Routes
app.get('/videos', videoController.listVideos); // /api/videos
app.get('/secret-videos', videoController.listSecretVideos); // /api/secret-videos

export default app;
