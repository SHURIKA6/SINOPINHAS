import { corsHeaders } from '../utils/api-utils.js';

export const corsMiddleware = async (c, next) => {
    // Add CORS headers to ALL responses (success or error) via Context
    Object.entries(corsHeaders).forEach(([key, value]) => {
        c.header(key, value);
    });

    // Handle Preflight (OPTIONS)
    if (c.req.method === 'OPTIONS') {
        return c.text('', 204);
    }

    try {
        await next();
    } catch (err) {
        // If an error bubbling up wasn't caught, headers might be missing if response wasn't started
        // But c.header sets them for the response object.
        // We re-set them in the Global Error Handler just to be safe, but this middleware logic is mainly for success/preflight.
        throw err;
    }
};
