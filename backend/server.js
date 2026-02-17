import { Hono } from "hono";
import { corsMiddleware } from './src/middleware/cors.js';
import { securityHeaders } from './src/middleware/securityHeaders.js';
import { createErrorResponse, corsHeaders } from './src/utils/api-utils.js';
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import videoRoutes from './src/routes/video.js';
import socialRoutes from './src/routes/social.js';
import debugRoutes from './src/routes/debug.js';
import healthRoutes from './src/routes/health.js';
import newsRoutes from './src/routes/news.js';
import weatherRoutes from './src/routes/weather.js';
import localRoutes from './src/routes/local.js';
import pushRoutes from './src/routes/push.js';
import { initDatabase } from './src/db/index.js';

const app = new Hono();

// Função Middleware: Aplica CORS Centralizado
app.use('*', corsMiddleware);

// Função Middleware: Aplica cabeçalhos de segurança (OWASP)
app.use('*', securityHeaders);

// blockVPN aplicado apenas nas rotas de escrita (upload, delete, auth) — ver video.js e auth.js

// Montagem das Rotas do Sistema
app.route('/api', authRoutes);
app.route('/api', adminRoutes);
app.route('/api', videoRoutes);
app.route('/api', socialRoutes);
app.route('/api', newsRoutes); // Rota de Notícias
app.route('/api', localRoutes); // Rotas do Guia Local (Eventos e Lugares)
app.route('/api', pushRoutes); // Rotas de Notificações Push
app.route('/api/weather', weatherRoutes);
app.route('/api/debug', debugRoutes);
app.route('/api/health', healthRoutes);

app.get("/", (c) => {
  return c.json({
    status: "online",
    service: "SINOPINHAS Backend API",
    version: "3.3 (Reviewed)",
    timestamp: new Date().toISOString(),
  });
});

import { HTTPException } from 'hono/http-exception';

app.onError((err, c) => {
  console.error("❌ Global Error Handler:", err);

  if (err instanceof HTTPException) {
    return createErrorResponse(c, "REQUEST_ERROR", err.message, err.status);
  }

  // Se for erro de banco Neon, tenta extrair mais info
  const dbError = err.code ? `[${err.code}] ${err.message}` : err.message;

  return createErrorResponse(c, "INTERNAL_ERROR", "O servidor encontrou um erro interno.", 500, dbError);
});

// Função: Handler de fetch padrão do Hono
const honoFetch = app.fetch;

export default {
  async fetch(request, env, ctx) {
    try {
      // Inicializar banco de dados se necessário
      await initDatabase(env);

      // OPTIONS já é tratado pelo corsMiddleware — sem duplicação
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
          ...corsHeaders(request.headers.get('Origin')),
          'Content-Type': 'application/json'
        }
      });
    }
  }
};
