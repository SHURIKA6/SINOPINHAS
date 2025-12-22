import { Hono } from 'hono';
import { blockVPN } from '../middleware/vpn.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { limiter } from '../middleware/rateLimit.js';
import * as schemas from '../schemas/social.js';
import * as socialController from '../controllers/socialController.js';
import * as shuraController from '../controllers/shuraController.js';

const app = new Hono();

app.post('/log-terms', blockVPN, socialController.logTerms);

app.post('/videos/:id/like', authMiddleware, limiter(30, 60), socialController.likeVideo); // 30 likes/min
app.post('/videos/:id/view', socialController.viewVideo); // Views are anonymous/background

app.post('/comment', authMiddleware, limiter(5, 60), validate(schemas.commentSchema), socialController.postComment); // 5 comments/min
app.get('/comments/:videoId', socialController.getComments);
app.delete('/comments/:id', authMiddleware, socialController.deleteComment);

app.get('/notifications/:userId', authMiddleware, socialController.getNotifications);
app.get('/users/all', socialController.listAllUsers);
app.get('/users/:id', socialController.getPublicProfile);
app.get('/achievements/:type/users', socialController.getUsersByAchievement);

app.post('/send-message', authMiddleware, limiter(20, 60), validate(schemas.sendMessageSchema), socialController.sendMessage); // 20 msgs/min
app.get('/inbox/:userId', authMiddleware, socialController.getInbox);
app.post('/conversations/:id/read', authMiddleware, socialController.markAsRead);
app.get('/admin/inbox', authMiddleware, requireAdmin, socialController.getAdminInbox);
app.post('/support', socialController.createSupportTicket);

// Shura Logs Messages
app.post('/shura/messages', authMiddleware, shuraController.submitShuraMessage);
app.get('/shura/messages/approved', shuraController.getApprovedShuraMessages);
app.get('/shura/system-logs', shuraController.getSystemAuditLogs);

export default app;
