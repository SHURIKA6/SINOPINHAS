import pg from 'pg';
const { Pool } = pg;

let pool;

const createPool = (env) => {
    // Basic connection config
    const config = {
        connectionString: env.DATABASE_URL,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 5000,
        max: 10, // Limit connections in serverless environment
    };

    // Add SSL for production (Hyperdrive/Neon/Supabase usually need this)
    if (!env.DATABASE_URL.includes('sslmode=disable') && !env.DATABASE_URL.includes('localhost')) {
        config.ssl = { rejectUnauthorized: false };
    }

    const newPool = new Pool(config);

    newPool.on('error', (err) => {
        console.error('❌ FATAL: Unexpected error on idle client', err);
        // Don't exit process in Workers, but we might want to unset the pool so it recreates
        // However, pg pool handles reconnection automatically for many cases.
    });

    return newPool;
};

export async function queryDB(sql, params = [], env) {
    if (!env.DATABASE_URL) {
        throw new Error("DATABASE_URL não configurada nas variáveis de ambiente!");
    }

    // Singleton pattern for connection pool
    if (!pool) {
        console.log("🔌 Inicializando novo Pool de conexões...");
        pool = createPool(env);
    }

    let retries = 2; // Try up to 3 times total
    let lastError = null;



    while (retries >= 0) {
        const start = Date.now();
        let client;
        try {
            // Defensive setup: Strict timeout for connection and query
            const dbOperation = async () => {
                const c = await pool.connect();
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
        } catch (err) {
            lastError = err;
            console.error(`⚠️ Erro no banco (Tentativa ${3 - retries}/3):`, err.message);

            if (retries === 0) break;

            retries--;
            await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
        }
        // Client is released inside dbOperation finally block
    }

    // If we're here, all retries failed
    console.error("❌ Erro PERSISTENTE no banco de dados:", lastError);
    throw lastError;
}

export async function healthCheck(env) {
    try {
        const res = await queryDB('SELECT 1 as healthy', [], env);
        return res.rows[0].healthy === 1;
    } catch (e) {
        console.error("Health check failed:", e);
        return false;
    }
}
