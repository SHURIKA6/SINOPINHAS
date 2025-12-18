import { Hono } from 'hono';
import { blockVPN } from '../middleware/vpn.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import * as schemas from '../schemas/social.js';
import * as socialController from '../controllers/socialController.js';

const app = new Hono();

app.post('/log-terms', blockVPN, socialController.logTerms);

app.post('/videos/:id/like', socialController.likeVideo);
app.post('/videos/:id/view', socialController.viewVideo);

app.post('/comment', validate(schemas.commentSchema), socialController.postComment);
app.get('/comments/:videoId', socialController.getComments);
app.delete('/comments/:id', socialController.deleteComment);

app.get('/notifications/:userId', socialController.getNotifications);
app.get('/users/all', socialController.listAllUsers);
app.post('/send-message', validate(schemas.sendMessageSchema), socialController.sendMessage);
app.get('/inbox/:userId', socialController.getInbox);
app.post('/conversations/:id/read', socialController.markAsRead);
app.get('/admin/inbox', authMiddleware, requireAdmin, socialController.getAdminInbox);
app.post('/support', socialController.createSupportTicket);

export default app;
