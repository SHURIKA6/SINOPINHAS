import { Hono } from 'hono';
import { blockVPN } from '../middleware/vpn.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware, requireAuth } from '../middleware/auth.js';
import * as schemas from '../schemas/auth.js';
import * as authController from '../controllers/authController.js';
import { limiter } from '../middleware/rateLimit.js';

const app = new Hono();

app.post('/register',
    blockVPN,
    limiter(5, 60), // 5 attempts per minute (Prevent spam registration)
    validate(schemas.registerSchema),
    authController.register
);
app.post('/login',
    blockVPN,
    limiter(10, 60), // 10 attempts per minute (Prevent brute force)
    validate(schemas.loginSchema),
    authController.login
);
app.put('/users/:id', authMiddleware, requireAuth, authController.updateProfile);

export default app;
