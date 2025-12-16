import { Hono } from 'hono';
import * as adminController from '../controllers/adminController.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const app = new Hono();

app.post('/admin/login', adminController.login);
app.get('/admin/users', authMiddleware, requireAdmin, adminController.listUsers);
app.post('/admin/reset-password', authMiddleware, requireAdmin, adminController.resetPassword);
app.delete('/admin/users/:userId', authMiddleware, requireAdmin, adminController.banUser);
app.get('/admin/logs', authMiddleware, requireAdmin, adminController.getLogs);

export default app;
