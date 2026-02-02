import { Hono } from 'hono';
import * as adminController from '../controllers/adminController.js';
import * as shuraController from '../controllers/shuraController.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

import { limiter } from '../middleware/rateLimit.js';

const app = new Hono();

app.post('/admin/login', limiter(3, 60), adminController.login);
app.get('/admin/users', authMiddleware, requireAdmin, adminController.listUsers);
app.post('/admin/reset-password', authMiddleware, requireAdmin, adminController.resetPassword);
app.delete('/admin/users/:userId', authMiddleware, requireAdmin, adminController.banUser);
app.post('/admin/toggle-role', authMiddleware, requireAdmin, adminController.toggleAdmin);
app.get('/admin/logs', authMiddleware, requireAdmin, adminController.getLogs);
app.get('/admin/users/:userId/logs', authMiddleware, requireAdmin, adminController.getUserLogs);

// Rotas: Gerenciamento de Mensagens Shura (Admin)
app.get('/admin/shura/messages', authMiddleware, requireAdmin, shuraController.getAllShuraMessages);
app.post('/admin/shura/messages/toggle-approve', authMiddleware, requireAdmin, shuraController.toggleApproveShuraMessage);
app.delete('/admin/shura/messages/:id', authMiddleware, requireAdmin, shuraController.deleteShuraMessage);

export default app;
