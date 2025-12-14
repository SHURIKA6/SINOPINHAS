import { Hono } from 'hono';
import { blockVPN } from '../middleware/vpn.js';
import * as authController from '../controllers/authController.js';

const app = new Hono();

app.post('/register', blockVPN, authController.register);
app.post('/login', blockVPN, authController.login);
app.put('/users/:id', authController.updateProfile);

export default app;
