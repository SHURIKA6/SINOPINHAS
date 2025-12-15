import { Hono } from "hono";
import { cors } from "hono/cors";
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import videoRoutes from './src/routes/video.js';
import socialRoutes from './src/routes/social.js';
import debugRoutes from './src/routes/debug.js';

const app = new Hono();

app.use("/*", async (c, next) => {
  // FORCE CORS HEADERS - Applied before route handler
  const origin = c.req.header('Origin') || 'https://sinopinhas.vercel.app';
  c.header('Access-Control-Allow-Origin', origin);
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Upgrade-Insecure-Requests, X-Requested-With');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '600');

  try {
    await next();
  } catch (err) {
    // Catch ANY error that bubbled up and wasn't caught by onError yet
    // This is a safety net. Usually onError handles it.
    console.error("🔥 Global Middleware Catch:", err);
    throw err;
  }
});

// Handle OPTIONS explicitly just in case
app.options("/*", (c) => {
  const origin = c.req.header('Origin') || 'https://sinopinhas.vercel.app';
  return c.text('', 204, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '600'
  });
});

// Mount routes
app.route('/api', authRoutes);
app.route('/api', adminRoutes);
app.route('/api', videoRoutes);
app.route('/api', socialRoutes);
app.route('/api/debug', debugRoutes);

app.get("/", (c) => {
  return c.json({
    status: "online",
    service: "SINOPINHAS Backend API",
    version: "3.0 (Modular)",
    timestamp: new Date().toISOString(),
  });
});

app.onError((err, c) => {
  console.error("❌ Erro não tratado:", err);

  // Dynamic origin reflection for credentials support
  const origin = c.req.header('Origin') || 'https://sinopinhas.vercel.app';
  c.header('Access-Control-Allow-Origin', origin);
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Allow-Credentials', 'true');

  return c.json({
    error: "Erro interno no servidor",
    details: err.message || "Unknown error"
  }, 500);
});

export default app;
