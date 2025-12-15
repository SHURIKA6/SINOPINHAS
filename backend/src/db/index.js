import pg from 'pg';
const { Pool } = pg;

let pool;

export async function queryDB(sql, params = [], env) {
    try {
        // Singleton pattern for connection pool
        if (!pool) {
            if (!env.DATABASE_URL) {
                throw new Error("DATABASE_URL não configurada nas variáveis de ambiente!");
            }

            console.log("🔌 Inicializando novo Pool de conexões...");

            // Basic connection config
            const config = {
                connectionString: env.DATABASE_URL,
                idleTimeoutMillis: 10000, // 10s idle
                connectionTimeoutMillis: 3000, // 3s fail fast
            };

            // Add SSL for production (Hyperdrive/Neon/Supabase usually need this)
            if (env.DATABASE_URL.includes('sslmode=disable')) {
                // Do nothing
            } else {
                config.ssl = { rejectUnauthorized: false };
            }

            pool = new Pool(config);

            pool.on('error', (err) => {
                console.error('❌ Erro inesperado no cliente PG', err);
                // process.exit(-1) is bad in Workers, just log and let pool reconnect
            });
        }

        const start = Date.now();
        const result = await pool.query(sql, params);
        const duration = Date.now() - start;

        // Log slow queries (> 500ms)
        if (duration > 500) {
            console.warn(`⚠️ Query lenta (${duration}ms): ${sql.substring(0, 100)}...`);
        }

        return result;
    } catch (err) {
        console.error("❌ Erro no banco de dados:", err);
        throw err;
    }
}
