import { jwt } from 'hono/jwt';
import { createErrorResponse } from '../utils/api-utils.js';

export const authMiddleware = async (c, next) => {
    if (!c.env.JWT_SECRET) {
        console.error('❌ FATAL: JWT_SECRET não configurado no ambiente!');
        return c.json({ error: 'Erro interno de configuração do servidor' }, 500);
    }
    const jwtMiddleware = jwt({
        secret: c.env.JWT_SECRET,
    });
    return jwtMiddleware(c, next);
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
