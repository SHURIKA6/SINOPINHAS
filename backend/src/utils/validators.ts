import { z, ZodSchema } from 'zod';
import { createErrorResponse } from '../utils/api-utils';
import type { Context, Next } from 'hono';

export const loginSchema = z.object({
    username: z.string().min(1, "Username é obrigatório"),
    password: z.string().min(1, "Senha é obrigatória")
});

export const registerSchema = z.object({
    username: z.string().min(4, "Username deve ter no mínimo 4 caracteres"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

export const validate = (schema: ZodSchema) => async (c: Context, next: Next): Promise<Response | void> => {
    try {
        const body = await c.req.json();
        const result = schema.safeParse(body);
        if (!result.success) {
            const errors = result.error.issues.map(e => e.message).join(", ");
            return createErrorResponse(c, "INVALID_INPUT", errors, 400);
        }
        // Attach validated data to context if needed, or just proceed
        await next();
    } catch (e) {
        return createErrorResponse(c, "INVALID_INPUT", "Invalid JSON", 400);
    }
};
