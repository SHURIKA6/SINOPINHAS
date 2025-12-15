import { Hono } from "hono";
import { corsMiddleware } from './src/middleware/cors.js';
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import videoRoutes from './src/routes/video.js';
import socialRoutes from './src/routes/social.js';
import debugRoutes from './src/routes/debug.js';

const app = new Hono();

// Apply Centralized CORS Middleware
app.use("/*", corsMiddleware);

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
    version: "3.1 (Secured)",
    timestamp: new Date().toISOString(),
  });
});

app.onError((err, c) => {
  console.error("❌ Erro não tratado (Global Handler):", err);

  // Re-apply CORS headers just in case middleware didn't catch it (e.g. routing error)
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://sinopinhas.vercel.app',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade-Insecure-Requests, X-Requested-With, Accept, Content-Length',
    'Access-Control-Allow-Credentials': 'true',
  };
  Object.entries(corsHeaders).forEach(([key, value]) => {
    c.header(key, value);
  });

  // Return consistent JSON error
  return c.json({
    error: "INTERNAL_ERROR",
    message: "Ocorreu um erro interno no servidor.",
    details: err.message || "Unknown error" // Optional: remove details in strict production if desired
  }, 500);
});

export default app;
