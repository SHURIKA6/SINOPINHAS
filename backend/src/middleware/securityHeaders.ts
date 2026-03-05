/**
 * 🛡️ Security Headers Middleware
 * Adiciona cabeçalhos de proteção em todas as respostas da API.
 * Referência: https://owasp.org/www-project-secure-headers/
 */

import type { Context, Next } from 'hono';

const SECURITY_HEADERS: Record<string, string> = {
    // Permite iframes do mesmo origin (necessário para ads do AdSense)
    'X-Frame-Options': 'SAMEORIGIN',

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

    // Proteções Cross-Origin
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'X-Permitted-Cross-Domain-Policies': 'none',

    // Content Security Policy — permite AdSense + funcionalidades do site
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://adservice.google.com https://www.googletagservices.com https://tpc.googlesyndication.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://*.r2.dev https://www.gravatar.com https://pagead2.googlesyndication.com https://*.doubleclick.net",
        "media-src 'self' blob: https://*.r2.dev",
        "connect-src 'self' https://*.workers.dev https://api.open-meteo.com https://www.sonoticias.com.br https://pagead2.googlesyndication.com",
        "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com",
        "frame-ancestors 'self'",
    ].join('; '),
};

export const securityHeaders = async (c: Context, next: Next): Promise<void> => {
    await next();

    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
        c.header(header, value);
    }
};
