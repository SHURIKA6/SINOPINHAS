import { jwt } from 'hono/jwt';
import { createErrorResponse } from '../utils/api-utils.js';

export const authMiddleware = async (c, next) => {
    const jwtMiddleware = jwt({
        secret: c.env.JWT_SECRET || 'fallback_secret_please_change_in_prod',
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
        return createErrorResponse(c, "FORBIDDEN", "Acesso restrito a administradores", 403);
    }
    await next();
};
