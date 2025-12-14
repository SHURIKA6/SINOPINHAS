import { Hono } from "hono";
import { cors } from "hono/cors";
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import videoRoutes from './src/routes/video.js';
import socialRoutes from './src/routes/social.js';

const app = new Hono();

app.use("/*", cors({
  origin: [
    'https://sinopinhas.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Upgrade-Insecure-Requests'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true,
}));

// Mount routes
app.route('/api', authRoutes);
app.route('/api', adminRoutes);
app.route('/api', videoRoutes);
app.route('/api', socialRoutes);

app.get("/", (c) => {
  return c.json({
    status: "online",
    service: "SINOPINHAS Backend API",
    version: "3.0 (Modular)",
    timestamp: new Date().toISOString(),
  });
});

export default app;
