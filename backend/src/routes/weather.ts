import { Hono } from 'hono';
import * as weatherController from '../controllers/weatherController';

const app = new Hono();

app.get('/', weatherController.getWeather);

export default app;
