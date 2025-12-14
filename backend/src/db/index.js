export async function queryDB(sql, params = [], env) {
    try {
        const { Pool } = await import("pg");
        const pool = new Pool({ connectionString: env.DATABASE_URL });
        const result = await pool.query(sql, params);
        await pool.end();
        return result;
    } catch (err) {
        console.error("❌ Erro no banco de dados:", err);
        throw err;
    }
}
