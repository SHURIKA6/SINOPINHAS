import { Pool } from '@neondatabase/serverless';

let pool;

const createPool = (env) => {
    // Driver Neon Serverless lida com parsing e SSL automaticamente
    // Usa HTTP/WebSockets para escalar conexões
    const connectionString = env.DATABASE_URL;

    const newPool = new Pool({
        connectionString,
        max: 20, // Podemos ser mais generosos pois as conexões são virtualizadas
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

    // Padrão Singleton para o pool de conexões
    if (!pool) {
        console.log("🔌 Inicializando novo Pool Neon Serverless...");
        pool = createPool(env);
    }

    let retries = 2; // Tentar até 3 vezes no total
    let lastError = null;



    while (retries >= 0) {
        const start = Date.now();
        let client;
        try {
            // Setup Defensivo: Timeout estrito para conexão e query
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
            await new Promise(r => setTimeout(r, 500)); // Esperar 500ms antes de tentar novamente
        }
        // Cliente liberado dentro do bloco finally
    }

    // Se chegou aqui, todas as tentativas falharam
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
