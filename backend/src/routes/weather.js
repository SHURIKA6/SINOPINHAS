import { Hono } from 'hono';
import * as weatherController from '../controllers/weatherController.js';

const app = new Hono();

app.get('/', weatherController.getWeather);

export default app;
