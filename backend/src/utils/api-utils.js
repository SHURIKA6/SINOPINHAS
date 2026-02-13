// Origens permitidas — configurável via env ALLOWED_ORIGINS (separadas por vírgula)
const DEFAULT_ORIGINS = [
    'https://sinopinhas.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
];

export function getCorsOrigin(requestOrigin, env) {
    const allowedOrigins = env?.ALLOWED_ORIGINS
        ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : DEFAULT_ORIGINS;

    // Permitir previews do Vercel automaticamente
    if (requestOrigin && (
        allowedOrigins.includes(requestOrigin) ||
        requestOrigin.endsWith('.vercel.app')
    )) {
        return requestOrigin;
    }
    return allowedOrigins[0]; // Fallback para o domínio principal
}

export const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://sinopinhas.vercel.app',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
    'Access-Control-Allow-Credentials': 'true',
};

/**
 * Helper para padronizar respostas da API
 * @param {import('hono').Context} c 
 * @param {object} data 
 * @param {number} status 
 */
export const createResponse = (c, data, status = 200) => {
    // Garantir que headers sejam aplicados
    Object.entries(corsHeaders).forEach(([key, value]) => {
        c.header(key, value);
    });
    return c.json(data, status);
};

/**
 * Helper para respostas de erro
 * @param {import('hono').Context} c 
 * @param {string} code 
 * @param {string} message 
 * @param {number} status 
 * @param {object} details 
 */
export const createErrorResponse = (c, code, message, status = 500, details = null) => {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        c.header(key, value);
    });

    const body = {
        error: code,
        message: message
    };

    if (details) {
        body.details = details;
    }

    return c.json(body, status);
};
