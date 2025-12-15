
export const corsMiddleware = async (c, next) => {
    // Definir headers centralizados
    const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://sinopinhas.vercel.app', // Hardcoded production origin
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade-Insecure-Requests, X-Requested-With, Accept, Content-Length',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    };

    // Aplicar headers no contexto
    Object.entries(corsHeaders).forEach(([key, value]) => {
        c.header(key, value);
    });

    // Tratar Preflight (OPTIONS)
    if (c.req.method === 'OPTIONS') {
        return c.text('', 204);
    }

    try {
        await next();
    } catch (err) {
        console.error("🔥 Global Middleware Component Catch:", err);
        // Garante que headers persistam mesmo no erro
        Object.entries(corsHeaders).forEach(([key, value]) => {
            c.header(key, value);
        });
        throw err;
    }
};
