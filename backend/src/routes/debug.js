import { Hono } from 'hono';
import { queryDB, initDatabase } from '../db/index.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';

const app = new Hono();

app.get('/health', async (c) => {
    const env = c.env;
    const diagnostics = {
        timestamp: new Date().toISOString(),
        env: {
            DATABASE_URL: env.DATABASE_URL ? "Defined (Starts with " + env.DATABASE_URL.substring(0, 10) + "...)" : "UNDEFINED ❌",
            ADMIN_PASSWORD: env.ADMIN_PASSWORD ? "Defined (Length " + env.ADMIN_PASSWORD.length + ")" : "UNDEFINED ❌",
            JWT_SECRET: env.JWT_SECRET ? "Defined ✅" : "UNDEFINED ❌",
        },
        db_connection: "Testing..."
    };

    try {
        const result = await queryDB("SELECT NOW() as now", [], env);
        diagnostics.db_connection = "SUCCESS ✅";
        diagnostics.db_result = result.rows[0];
        diagnostics.db_result = result.rows[0];
        return createResponse(c, diagnostics);
    } catch (err) {
        console.error("Health Check DB Error:", err);
        diagnostics.db_connection = "FAILED ❌";
        diagnostics.error = err.message;
        diagnostics.stack = err.stack;
        return createErrorResponse(c, "HEALTH_CHECK_FAILED", "Falha no diagnóstico", 500, diagnostics);
    }
});

app.get('/fix-db', async (c) => {
    const env = c.env;
    try {
        const migrations = [
            // Correção: Notificações
            "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE",
            "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_id INTEGER",
            "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT",
            "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id INTEGER",

            // Correção: Mensagens
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS from_id INTEGER",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS to_id INTEGER",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS msg TEXT",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE",

            // Sincronização: Corrigir dados se colunas antigas existirem (ignora erros)
            "UPDATE notifications SET is_read = read WHERE is_read IS NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='read')",
            "UPDATE messages SET from_id = sender_id WHERE from_id IS NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='sender_id')",
            "UPDATE messages SET to_id = recipient_id WHERE to_id IS NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='recipient_id')",
            "UPDATE messages SET msg = content WHERE msg IS NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='content')",

            // Schema: Vídeos e Usuários
            "ALTER TABLE videos ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'video'",
            "ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_secret BOOLEAN DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT",
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT",

            // Schema: Comentários e Visualizações
            "ALTER TABLE comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()",
            "ALTER TABLE views ADD COLUMN IF NOT EXISTS user_id INTEGER",
            "ALTER TABLE views ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()",
            "ALTER TABLE views DROP COLUMN IF EXISTS views",
            "ALTER TABLE views DROP CONSTRAINT IF EXISTS views_video_id_key"
        ];

        const results = [];
        for (const q of migrations) {
            try {
                await queryDB(q, [], env);
                results.push(`✅ ${q.substring(0, 40)}...`);
            } catch (err) {
                results.push(`❌ ${q.substring(0, 40)}...: ${err.message}`);
            }
        }

        // Executar inicialização completa do banco
        await initDatabase(env);
        results.push("Database Init Executed");

        return createResponse(c, { success: true, actions: results });
    } catch (err) {
        return createErrorResponse(c, "DB_FIX_FAILED", "Falha ao corrigir banco", 500, err.message);
    }
});

app.post('/setup-db', async (c) => {
    try {
        await initDatabase(c.env);
        return createResponse(c, { success: true, message: 'Database initialized' });
    } catch (err) {
        return createErrorResponse(c, "SETUP_FAILED", err.message, 500);
    }
});

export default app;
