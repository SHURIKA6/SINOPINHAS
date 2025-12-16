import { jwt } from 'hono/jwt';
import { createErrorResponse } from '../utils/api-utils.js';

export const authMiddleware = async (c, next) => {
    const jwtMiddleware = jwt({
        secret: c.env.JWT_SECRET || 'development_secret_123',
    });
    return jwtMiddleware(c, next);
};

// Custom middleware to enforce specific roles or extract user data cleanly
export const requireAuth = async (c, next) => {
    const payload = c.get('jwtPayload');
    if (!payload) {
        return createErrorResponse(c, "UNAUTHORIZED", "Token inválido ou ausente", 401);
    }
    await next();
};

export const requireAdmin = async (c, next) => {
    const payload = c.get('jwtPayload');
    if (!payload || payload.role !== 'admin') {
        const role = payload?.role || 'undefined';
        const debugInfo = JSON.stringify(payload);
        console.log(`❌ Acesso negado Admin. Role: ${role}, ID: ${payload?.id}`);
        return createErrorResponse(c, "FORBIDDEN", `Acesso negado. Role: ${role}.`, 403);
    }
    await next();
};
