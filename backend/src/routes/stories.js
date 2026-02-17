import { Hono } from 'hono';
import * as storyController from '../controllers/storyController.js';
import { authMiddleware } from '../middleware/auth.js';

const app = new Hono();

app.post('/', authMiddleware, storyController.uploadStory);
app.get('/', storyController.listStories); // Pode ser acessado sem auth (mas view status muda)
app.post('/:id/view', authMiddleware, storyController.viewStory);
app.delete('/:id', authMiddleware, storyController.deleteStory);

export default app;
