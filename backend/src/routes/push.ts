import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import * as pushController from '../controllers/pushController';

const app = new Hono();

app.post('/push/subscribe', authMiddleware, pushController.subscribe);
app.post('/push/unsubscribe', pushController.unsubscribe);

export default app;
