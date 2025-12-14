import { Hono } from 'hono';
import * as adminController from '../controllers/adminController.js';

const app = new Hono();

app.post('/admin/login', adminController.login);
app.get('/admin/users', adminController.listUsers);
app.post('/admin/reset-password', adminController.resetPassword);
app.delete('/admin/users/:userId', adminController.banUser);
app.get('/admin/logs', adminController.getLogs);

export default app;
