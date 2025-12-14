import { Hono } from 'hono';
import { blockVPN } from '../middleware/vpn.js';
import { validate } from '../middleware/validate.js';
import * as schemas from '../schemas/auth.js';
import * as authController from '../controllers/authController.js';

const app = new Hono();

app.post('/register', blockVPN, validate(schemas.registerSchema), authController.register);
app.post('/login', blockVPN, validate(schemas.loginSchema), authController.login);
app.put('/users/:id', validate(schemas.updateProfileSchema), authController.updateProfile);

export default app;
