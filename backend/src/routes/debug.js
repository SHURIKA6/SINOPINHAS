import { Hono } from 'hono';
import { queryDB } from '../db/index.js';

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
        return c.json(diagnostics);
    } catch (err) {
        console.error("Health Check DB Error:", err);
        diagnostics.db_connection = "FAILED ❌";
        diagnostics.error = err.message;
        diagnostics.stack = err.stack;
        return c.json(diagnostics, 500);
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
            )`
        ];

        const results = [];
        for (const q of queries) {
            await queryDB(q, [], env);
            results.push("Executed: " + q.substring(0, 50) + "...");
        }

        return c.json({ success: true, actions: results });
    } catch (err) {
        return c.json({ error: "DB Fix Failed", details: err.message }, 500);
    }
});

export default app;
