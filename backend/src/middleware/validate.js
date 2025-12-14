import { z } from 'zod';

export const validate = (schema) => async (c, next) => {
    try {
        const body = await c.req.json();
        const result = schema.safeParse(body);

        if (!result.success) {
            const errorMsg = result.error.errors.map(e => e.message).join(', ');
            return c.json({ error: errorMsg }, 400);
        }

        // Attach validated data to request for controller to use if needed
        // In Hono we can't easily mute the request body but we verified it matches schema
        return await next();
    } catch (err) {
        return c.json({ error: "Payload inválido" }, 400);
    }
};
