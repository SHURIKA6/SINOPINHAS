import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Env } from '../types';

// Origens permitidas — configurável via env ALLOWED_ORIGINS (separadas por vírgula)
const DEFAULT_ORIGINS: string[] = [
    'https://sinopinhas.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
];

export function getCorsOrigin(requestOrigin: string | undefined, env?: Partial<Env>): string {
    const allowedOrigins = env?.ALLOWED_ORIGINS
        ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : DEFAULT_ORIGINS;

    // Permitir apenas origens explicitamente autorizadas
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        return requestOrigin;
    }
    return allowedOrigins[0]; // Fallback para o domínio principal
}

export const corsHeaders = (origin?: string): Record<string, string> => ({
    'Access-Control-Allow-Origin': origin || DEFAULT_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
    'Access-Control-Allow-Credentials': 'true',
});

/**
 * Helper para padronizar respostas da API
 */
export const createResponse = (c: Context, data: unknown, status: ContentfulStatusCode = 200) => {
    const origin = getCorsOrigin(c.req.header('Origin'), c.env);
    const headers = corsHeaders(origin);
    Object.entries(headers).forEach(([key, value]) => {
        c.header(key, value);
    });
    return c.json(data, status);
};

/**
 * Helper para respostas de erro
 */
export const createErrorResponse = (
    c: Context,
    code: string,
    message: string,
    status: ContentfulStatusCode = 500,
    details: unknown = null
) => {
    const origin = getCorsOrigin(c.req.header('Origin'), c.env);
    const headers = corsHeaders(origin);
    Object.entries(headers).forEach(([key, value]) => {
        c.header(key, value);
    });

    const body: Record<string, unknown> = {
        error: code,
        message: message
    };

    if (details) {
        body.details = details;
    }

    return c.json(body, status);
};
