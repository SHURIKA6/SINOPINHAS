import { Hono } from "hono";
import { corsMiddleware } from './src/middleware/cors';
import { securityHeaders } from './src/middleware/securityHeaders';
import { createErrorResponse, corsHeaders } from './src/utils/api-utils';
import authRoutes from './src/routes/auth';
import adminRoutes from './src/routes/admin';
import videoRoutes from './src/routes/video';
import socialRoutes from './src/routes/social';
import debugRoutes from './src/routes/debug';
import healthRoutes from './src/routes/health';
import newsRoutes from './src/routes/news';
import weatherRoutes from './src/routes/weather';
import localRoutes from './src/routes/local';
import pushRoutes from './src/routes/push';
import storiesRoutes from './src/routes/stories';
import { initDatabase } from './src/db/index';

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
app.route('/api/stories', storiesRoutes); // Rotas de Stories
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

  // Log interno completo sem vazar para o cliente
  const errAny = err as any;
  const dbError = errAny.code ? `[${errAny.code}] ${err.message}` : err.message;
  console.error("DB Error Details:", dbError);

  return createErrorResponse(c, "INTERNAL_ERROR", "O servidor encontrou um erro interno.", 500);
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
    } catch (err: unknown) {
      console.error("🔥 CRITICAL ENTRYPOINT ERROR:", err);

      // Resposta manual de fallback para CORS em caso de crash total
      return new Response(JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: err instanceof Error ? err.message : String(err)
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
