import { corsHeaders, getCorsOrigin } from '../utils/api-utils.js';

export const corsMiddleware = async (c, next) => {
    // Definir origem dinâmica baseada no request
    const requestOrigin = c.req.header('Origin');
    const origin = getCorsOrigin(requestOrigin, c.env);
    const headers = corsHeaders(origin);

    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Methods', headers['Access-Control-Allow-Methods']);
    c.header('Access-Control-Allow-Headers', headers['Access-Control-Allow-Headers']);
    c.header('Access-Control-Allow-Credentials', headers['Access-Control-Allow-Credentials']);

    // Tratamento de Requisicões Preflight (OPTIONS) — ponto único
    if (c.req.method === 'OPTIONS') {
        return c.text('', 204);
    }

    await next();
};
