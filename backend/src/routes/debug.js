import { Hono } from 'hono';
import { queryDB, ensureIndexes } from '../db/index.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';

const app = new Hono();

app.get('/health', async (c) => {
    const env = c.env;
    const diagnostics = {
        timestamp: new Date().toISOString(),
        env: {
            DATABASE_URL: env.DATABASE_URL ? "Defined (Starts with " + env.DATABASE_URL.substring(0, 10) + "...)" : "UNDEFINED ❌",
            ADMIN_PASSWORD: env.ADMIN_PASSWORD ? "Defined (Length " + env.ADMIN_PASSWORD.length + ")" : "UNDEFINED ❌",
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
        const queries = [
            `CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                video_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS likes (
                id SERIAL PRIMARY KEY,
                video_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS views (
                id SERIAL PRIMARY KEY,
                video_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                related_id INTEGER,
                message TEXT,
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                from_id INTEGER NOT NULL,
                to_id INTEGER NOT NULL,
                msg TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `ALTER TABLE videos ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'video'`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`
        ];

        const results = [];
        for (const q of queries) {
            await queryDB(q, [], env);
            results.push("Executed: " + q.substring(0, 50) + "...");
        }

        return createResponse(c, { success: true, actions: results });
    } catch (err) {
        return createErrorResponse(c, "DB_FIX_FAILED", "Falha ao corrigir banco", 500, err.message);
    }
});

app.post('/setup-db', async (c) => {
    try {
        await ensureIndexes(c.env);
        return createResponse(c, { success: true, message: 'Indexes verified/created' });
    } catch (err) {
        return createErrorResponse(c, "SETUP_FAILED", err.message, 500);
    }
});

export default app;
