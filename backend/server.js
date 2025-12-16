import { Hono } from "hono";
import { corsMiddleware } from './src/middleware/cors.js';
import { createErrorResponse, corsHeaders } from './src/utils/api-utils.js';
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import videoRoutes from './src/routes/video.js';
import socialRoutes from './src/routes/social.js';
import debugRoutes from './src/routes/debug.js';
import healthRoutes from './src/routes/health.js';

const app = new Hono();

// Apply Centralized CORS Middleware
app.use("/*", corsMiddleware);

// Mount routes
app.route('/api', authRoutes);
app.route('/api', adminRoutes);
app.route('/api', videoRoutes);
app.route('/api', socialRoutes);
app.route('/api/debug', debugRoutes);
app.route('/api/health', healthRoutes);

app.get("/", (c) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    c.header(key, value);
  });
  return c.json({
    status: "online",
    service: "SINOPINHAS Backend API",
    version: "3.2 (Audited)",
    timestamp: new Date().toISOString(),
  });
});

import { HTTPException } from 'hono/http-exception';

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    // Return the specific HTTP error (401, 403, 404, etc.)
    return createErrorResponse(c, "REQUEST_ERROR", err.message, err.status);
  }

  console.error("❌ Erro não tratado (Global Handler):", err);
  return createErrorResponse(c, "INTERNAL_ERROR", "Ocorreu um erro interno no servidor.", 500, err.message);
});

// Hono's default fetch handler
const honoFetch = app.fetch;

export default {
  async fetch(request, env, ctx) {
    try {
      // Global OPTIONS preflight check (Manual safeguard before matching routes)
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders
        });
      }

      return await honoFetch(request, env, ctx);
    } catch (err) {
      console.error("🔥 CRITICAL ENTRYPOINT ERROR:", err);

      // Fallback manual CORS response
      return new Response(JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: err.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};
