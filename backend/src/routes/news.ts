import { Hono } from 'hono';
import * as newsController from '../controllers/newsController';

const app = new Hono();

app.get('/news', newsController.getNews);

export default app;
