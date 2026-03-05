import type { Context } from 'hono';

/**
 * Bindings do ambiente Cloudflare Workers.
 * Representa todas as variáveis de ambiente, KV namespaces e R2 buckets.
 */
export interface Env {
    // Secrets (configurados via `wrangler secret put`)
    JWT_SECRET: string;
    DATABASE_URL: string;
    ADMIN_PASSWORD: string;
    VAPID_PRIVATE_KEY: string;
    BUNNY_API_KEY?: string;

    // Variáveis públicas (definidas no wrangler.toml)
    BUNNY_LIBRARY_ID: string;
    BUNNY_HOSTNAME: string;
    R2_PUBLIC_DOMAIN: string;
    VAPID_PUBLIC_KEY: string;
    VAPID_SUBJECT: string;
    ALLOWED_ORIGINS?: string;

    // KV Namespace bindings
    MURAL_STORE: KVNamespace;

    // R2 Bucket bindings
    VIDEO_BUCKET: R2Bucket;
}

/**
 * Payload decodificado do JWT.
 */
export interface JwtPayload {
    id: number;
    username: string;
    role: 'admin' | 'user';
    exp?: number;
    iat?: number;
    [key: string]: unknown; // campos extras
}

/**
 * Variáveis internas do Hono (set/get no contexto).
 */
interface AppVariables {
    jwtPayload: JwtPayload;
}

/**
 * Tipo do contexto Hono usado em toda a aplicação.
 */
export type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;
