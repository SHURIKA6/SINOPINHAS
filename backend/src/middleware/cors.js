import { corsHeaders } from '../utils/api-utils.js';

export const corsMiddleware = async (c, next) => {
    // Função: Adicionar cabeçalhos CORS globais para todas as respostas
    Object.entries(corsHeaders).forEach(([key, value]) => {
        c.header(key, value);
    });

    // Tratamento de Requisicões Preflight (OPTIONS)
    if (c.req.method === 'OPTIONS') {
        return c.text('', 204);
    }

    try {
        await next();
    } catch (err) {
        // Erro global: Garantir que headers sejam enviados mesmo em falhas não tratadas
        // O Hono geralmente lida com isso, mas este bloco é uma segurança extra.
        throw err;
    }
};
