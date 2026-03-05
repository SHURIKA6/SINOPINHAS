import { corsHeaders, getCorsOrigin } from '../utils/api-utils';
import type { Next } from 'hono';
import type { AppContext } from '../types';

export const corsMiddleware = async (c: AppContext, next: Next): Promise<Response | void> => {
    // Definir origem dinâmica baseada no request
    const requestOrigin = c.req.header('Origin') || c.req.header('Referer');
    
    // Extrair apenas a origem do Referer se Origin não estiver presente
    let originToCheck = requestOrigin;
    if (originToCheck && originToCheck.startsWith('http')) {
        try {
            const url = new URL(originToCheck);
            originToCheck = url.origin;
        } catch(e) { console.warn('CORS: Failed to parse origin URL:', (e as Error).message); }
    }

    const origin = getCorsOrigin(originToCheck, c.env);
    const headers = corsHeaders(origin);

    const method = c.req.method;

    // Proteção rigorosa contra CSRF para métodos que alteram estado
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        if (!originToCheck || origin !== originToCheck) {
            return c.json({ error: "FORBIDDEN", message: "Bloqueado por política CORS/CSRF" }, 403);
        }
    }

    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Methods', headers['Access-Control-Allow-Methods']);
    c.header('Access-Control-Allow-Headers', headers['Access-Control-Allow-Headers']);
    c.header('Access-Control-Allow-Credentials', headers['Access-Control-Allow-Credentials']);

    // Tratamento de Requisicões Preflight (OPTIONS) — ponto único
    if (method === 'OPTIONS') {
        return new Response(null, { status: 204 });
    }

    await next();
};
