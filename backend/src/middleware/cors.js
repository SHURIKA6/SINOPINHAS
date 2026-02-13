import { corsHeaders, getCorsOrigin } from '../utils/api-utils.js';

export const corsMiddleware = async (c, next) => {
    // Definir origem dinâmica baseada no request
    const requestOrigin = c.req.header('Origin');
    const origin = getCorsOrigin(requestOrigin, c.env);

    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
    c.header('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
    c.header('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);

    // Tratamento de Requisicões Preflight (OPTIONS) — ponto único
    if (c.req.method === 'OPTIONS') {
        return c.text('', 204);
    }

    await next();
};
