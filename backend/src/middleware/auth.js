import { jwt, verify } from 'hono/jwt';
import { createErrorResponse } from '../utils/api-utils.js';

// Helper: Extrair token do cookie
const getTokenFromCookie = (c) => {
    const cookieHeader = c.req.header('Cookie');
    if (!cookieHeader) return null;
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    return match ? match[1] : null;
};

export const authMiddleware = async (c, next) => {
    if (!c.env.JWT_SECRET) {
        console.error('❌ FATAL: JWT_SECRET não configurado no ambiente!');
        return c.json({ error: 'Erro interno de configuração do servidor' }, 500);
    }

    // Tentar extrair token do cookie primeiro, depois do header Authorization
    const cookieToken = getTokenFromCookie(c);
    const authHeader = c.req.header('Authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = cookieToken || headerToken;

    if (!token) {
        return createErrorResponse(c, "UNAUTHORIZED", "Token ausente", 401);
    }

    try {
        const payload = await verify(token, c.env.JWT_SECRET);
        c.set('jwtPayload', payload);
        await next();
    } catch (err) {
        return createErrorResponse(c, "UNAUTHORIZED", "Token inválido ou expirado", 401);
    }
};

// Middleware: Verificação Simples de Autenticação
export const requireAuth = async (c, next) => {
    const payload = c.get('jwtPayload');
    if (!payload) {
        return createErrorResponse(c, "UNAUTHORIZED", "Token inválido ou ausente", 401);
    }
    await next();
};

// Middleware: Proteção de Rotas Administrativas
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
