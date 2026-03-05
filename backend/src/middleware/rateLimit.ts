import type { Next } from 'hono';
import type { AppContext } from '../types';

export async function rateLimit(c: AppContext, next: Next, limit: number = 10, windowSeconds: number = 60): Promise<Response | void> {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const key = `rate_limit:${ip}`;

    try {
        const raw = await c.env.MURAL_STORE.get(key);
        const current = raw ? parseInt(raw) : 0;

        if (current >= limit) {
            return c.json({ error: 'Too Many Requests', message: 'Muitas tentativas. Tente novamente em 1 minuto.' }, 429);
        }

        await c.env.MURAL_STORE.put(key, (current + 1).toString(), { expirationTtl: windowSeconds });

    } catch (err) {
        console.error('Rate limit error:', err);
        // ✅ Fail-closed: bloqueia se KV falhar (segurança > disponibilidade)
        return c.json({ error: 'Service Unavailable', message: 'Tente novamente em instantes.' }, 503);
    }

    await next();
}

export const limiter = (limit: number, windowSeconds: number) => async (c: AppContext, next: Next): Promise<Response | void> => {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const path = c.req.path;
    const key = `rate_limit:${path}:${ip}`;

    try {
        const raw = await c.env.MURAL_STORE.get(key);
        const current = raw ? parseInt(raw) : 0;

        if (current >= limit) {
            return c.json({ error: 'Too Many Requests', message: 'Calma lá! Muitas requisições.' }, 429);
        }

        await c.env.MURAL_STORE.put(key, (current + 1).toString(), { expirationTtl: windowSeconds });
    } catch (e) {
        console.error('Rate limit fail', e);
        // ✅ Fail-closed: bloqueia se KV falhar
        return c.json({ error: 'Service Unavailable', message: 'Tente novamente em instantes.' }, 503);
    }

    await next();
};
