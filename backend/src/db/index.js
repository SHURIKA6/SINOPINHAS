import { Pool } from '@neondatabase/serverless';

let pool;

const createPool = (env) => {
    // Neon Serverless driver handles connection string parsing and SSL automatically
    // It uses HTTP/WebSockets for connection scaling
    const connectionString = env.DATABASE_URL;

    const newPool = new Pool({
        connectionString,
        max: 20, // We can be more generous with connections as they are virtualized
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 5000
    });

    newPool.on('error', (err) => {
        console.error('❌ FATAL: Unexpected error on idle client', err);
    });

    return newPool;
};

export async function queryDB(sql, params = [], env) {
    if (!env.DATABASE_URL) {
        throw new Error("DATABASE_URL não configurada nas variáveis de ambiente!");
    }

    // Singleton pattern for connection pool
    if (!pool) {
        console.log("🔌 Inicializando novo Pool Neon Serverless...");
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

export async function ensureIndexes(env) {
    console.log("🛠️ Verificando índices do banco de dados...");
    const queries = [
        "CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id)",
        "CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_messages_from_to ON messages(from_id, to_id)",
        "CREATE INDEX IF NOT EXISTS idx_likes_video_user ON likes(video_id, user_id)",
        "CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)"
    ];

    for (const q of queries) {
        try {
            await queryDB(q, [], env);
        } catch (err) {
            console.warn(`⚠️ Falha ao criar índice (não crítico): ${err.message}`);
        }
    }
    console.log("✅ Índices verificados/criados.");
}
