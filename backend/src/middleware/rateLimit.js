export async function rateLimit(c, limit = 10, windowSeconds = 60) {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const key = `rate_limit:${ip}`;

    // Simple fixed window counter using KV
    try {
        let current = await c.env.MURAL_STORE.get(key);
        current = current ? parseInt(current) : 0;

        if (current >= limit) {
            return c.json({ error: 'Too Many Requests', message: 'Muitas tentativas. Tente novamente em 1 minuto.' }, 429);
        }

        // Increment
        // KV doesn't have atomic increment, but eventual consistency is fine for rate limiting here
        await c.env.MURAL_STORE.put(key, (current + 1).toString(), { expirationTtl: windowSeconds });

    } catch (err) {
        console.error('Rate limit error:', err);
        // Fail open if KV fails (don't block user)
    }

    await next();
}

export const limiter = (limit, windowSeconds) => async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const path = c.req.path;
    const key = `rate_limit:${path}:${ip}`;

    try {
        let current = await c.env.MURAL_STORE.get(key);
        current = current ? parseInt(current) : 0;

        if (current >= limit) {
            return c.json({ error: 'Too Many Requests', message: 'Calma lá! Muitas requisições.' }, 429);
        }

        await c.env.MURAL_STORE.put(key, (current + 1).toString(), { expirationTtl: windowSeconds });
    } catch (e) {
        console.error('Rate limit fail', e);
    }

    await next();
};
