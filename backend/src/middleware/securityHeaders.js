/**
 * 🛡️ Security Headers Middleware
 * Adiciona cabeçalhos de proteção em todas as respostas da API.
 * Referência: https://owasp.org/www-project-secure-headers/
 */

const SECURITY_HEADERS = {
    // Previne clickjacking — ninguém pode embutir o site em iframe
    'X-Frame-Options': 'DENY',

    // Impede o navegador de adivinhar o tipo MIME
    'X-Content-Type-Options': 'nosniff',

    // Ativa proteção XSS nativa do navegador
    'X-XSS-Protection': '1; mode=block',

    // Controla quais informações o Referer envia
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Restringe permissões do navegador (câmera, mic, geolocation)
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

    // Força HTTPS por 1 ano + incluindo subdomínios
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // Content Security Policy — restringe origens de scripts, estilos e mídias
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://*.r2.dev https://www.gravatar.com",
        "media-src 'self' blob: https://*.r2.dev",
        "connect-src 'self' https://*.workers.dev https://api.open-meteo.com https://www.sonoticias.com.br",
        "frame-ancestors 'none'",
    ].join('; '),
};

export const securityHeaders = async (c, next) => {
    await next();

    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
        c.header(header, value);
    }
};
