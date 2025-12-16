import { createErrorResponse } from '../utils/api-utils.js';

export const validate = (schema) => async (c, next) => {
    try {
        const body = await c.req.json();
        const result = schema.safeParse(body);
        if (!result.success) {
            const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
            return createErrorResponse(c, "INVALID_INPUT", errors, 400);
        }
        await next();
    } catch (e) {
        return createErrorResponse(c, "INVALID_INPUT", "Invalid JSON body", 400);
    }
};
