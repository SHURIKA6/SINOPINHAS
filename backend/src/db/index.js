import pg from 'pg';
const { Pool } = pg;

let pool;

export async function queryDB(sql, params = [], env) {
    try {
        // Singleton pattern for connection pool
        if (!pool) {
            console.log("🔌 Inicializando novo Pool de conexões...");
            pool = new Pool({
                connectionString: env.DATABASE_URL,
                max: 10, // Max concurrent connections
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
                ssl: { rejectUnauthorized: false } // Required for most cloud DBs
            });

            pool.on('error', (err) => {
                console.error('❌ Erro inesperado no cliente PG', err);
                process.exit(-1);
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
