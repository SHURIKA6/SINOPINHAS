import { Hono } from 'hono';
import { healthCheck } from '../db/index.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';

const app = new Hono();

app.get('/', async (c) => {
    const isDbConnected = await healthCheck(c.env);

    if (isDbConnected) {
        return createResponse(c, {
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } else {
        return createErrorResponse(c, 'DB_ERROR', 'Database connection failed', 503);
    }
});

export default app;
