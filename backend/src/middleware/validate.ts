import { createErrorResponse } from '../utils/api-utils';
import type { Next, Context } from 'hono';
import type { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => async (c: Context, next: Next): Promise<Response | void> => {
    const contentType = c.req.header('content-type') || '';

    // If it's multipart (file upload), skip JSON validation here
    // the controller will handle formData parsing and validation
    if (contentType.includes('multipart/form-data')) {
        return await next();
    }

    try {
        const body = await c.req.json();
        const result = schema.safeParse(body);
        if (!result.success) {
            const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(", ");
            return createErrorResponse(c, "INVALID_INPUT", errors, 400);
        }
        await next();
    } catch (e) {
        // If content-type was supposed to be JSON but parsing failed
        if (contentType.includes('application/json')) {
            return createErrorResponse(c, "INVALID_INPUT", "Invalid JSON body", 400);
        }
        // For other types, just proceed
        await next();
    }
};
