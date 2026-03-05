import { Pool } from '@neondatabase/serverless';
import type { Env } from '../types';

let pool: Pool | null = null;

const createPool = (env: Env): Pool => {
    const connectionString = env.DATABASE_URL;

    const newPool = new Pool({
        connectionString,
        max: 20,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 5000
    });

    newPool.on('error', (err: Error) => {
        console.error('❌ FATAL: Unexpected error on idle client', err.message);
        if (err.message.includes('terminated') || err.message.includes('Connection')) {
            pool = null;
        }
    });

    return newPool;
};

export async function queryDB(sql: string, params: unknown[] = [], env: Env): Promise<any> {
    if (!env.DATABASE_URL) {
        throw new Error("DATABASE_URL não configurada nas variáveis de ambiente!");
    }

    let retries = 2;
    let lastError: unknown = null;

    while (retries >= 0) {
        const start = Date.now();

        if (!pool) {
            console.warn("🔌 Recriando Pool Neon Serverless para retry...");
            pool = createPool(env);
        }

        try {
            const dbOperation = async () => {
                const c = await pool!.connect();
                try {
                    return await c.query(sql, params);
                } finally {
                    c.release();
                }
            };

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("DB_TIMEOUT")), 5000)
            );

            const result = await Promise.race([dbOperation(), timeoutPromise]);

            const duration = Date.now() - start;
            if (duration > 500) {
                console.warn(`⚠️ Query lenta (${duration}ms): ${sql.substring(0, 100)}...`);
            }
            return result;
        } catch (err: unknown) {
            lastError = err;
            const message = err instanceof Error ? err.message : String(err);
            console.error(`⚠️ Erro no banco (Tentativa ${3 - retries}/3):`, message);

            if (message.includes('terminated') || message.includes('Connection')) {
                pool = null;
            }

            if (retries === 0) break;

            retries--;
            await new Promise(r => setTimeout(r, 500));
        }
    }

    console.error("❌ Erro PERSISTENTE no banco de dados:", lastError);
    throw lastError;
}

export async function healthCheck(env: Env): Promise<boolean> {
    try {
        const res = await queryDB('SELECT 1 as healthy', [], env);
        return res.rows[0].healthy === 1;
    } catch (e) {
        console.error("Health check failed:", e);
        return false;
    }
}

import { SCHEMA_QUERIES } from './schema';

let isInitialized = false;

export async function initDatabase(env: Env): Promise<void> {
    if (isInitialized) return;

    console.warn("🛠️ Inicializando banco de dados...");
    for (const q of SCHEMA_QUERIES) {
        try {
            await queryDB(q, [], env);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`⚠️ Erro na query de inicialização (ignorado): ${message}`);
        }
    }

    isInitialized = true;
    console.warn("✅ Banco de dados inicializado.");
}
