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

export default app;
