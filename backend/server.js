import { Hono } from "hono";
import { corsMiddleware } from './src/middleware/cors.js';
import { createErrorResponse, corsHeaders } from './src/utils/api-utils.js';
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import videoRoutes from './src/routes/video.js';
import socialRoutes from './src/routes/social.js';
import debugRoutes from './src/routes/debug.js';
import healthRoutes from './src/routes/health.js';
import newsRoutes from './src/routes/news.js';
import weatherRoutes from './src/routes/weather.js';
import { initDatabase } from './src/db/index.js';

const app = new Hono();

// Aplicar Middleware de CORS Centralizado
app.use('*', corsMiddleware);

// Montagem das Rotas do Sistema
app.route('/api', authRoutes);
app.route('/api', adminRoutes);
app.route('/api', videoRoutes);
app.route('/api', socialRoutes);
app.route('/api', newsRoutes); // News Route
app.route('/api/weather', weatherRoutes);
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
    // Retornar a exceção HTTP específica (401, 403, 404, etc.)
    return createErrorResponse(c, "REQUEST_ERROR", err.message, err.status);
  }

  console.error("❌ Erro não tratado (Global Handler):", err);
  return createErrorResponse(c, "INTERNAL_ERROR", "Ocorreu um erro interno no servidor.", 500, err.message);
});

// Handler de fetch padrão do Hono
const honoFetch = app.fetch;

export default {
  async fetch(request, env, ctx) {
    try {
      // Inicializar banco de dados se necessário
      await initDatabase(env);

      // Verificação de preflight OPTIONS Global
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders
        });
      }

      return await honoFetch(request, env, ctx);
    } catch (err) {
      console.error("🔥 CRITICAL ENTRYPOINT ERROR:", err);

      // Resposta manual de fallback para CORS em caso de crash total
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
