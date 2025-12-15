export const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://sinopinhas.vercel.app',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade-Insecure-Requests, X-Requested-With, Accept, Content-Length',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
};

/**
 * Helper to standard API responses
 * @param {import('hono').Context} c 
 * @param {object} data 
 * @param {number} status 
 */
export const createResponse = (c, data, status = 200) => {
    // Ensure headers are applied
    Object.entries(corsHeaders).forEach(([key, value]) => {
        c.header(key, value);
    });
    return c.json(data, status);
};

/**
 * Helper for error responses
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
