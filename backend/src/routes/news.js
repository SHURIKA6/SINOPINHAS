import { Hono } from 'hono';
import * as newsController from '../controllers/newsController.js';

const app = new Hono();

app.get('/news', newsController.getNews);

export default app;
