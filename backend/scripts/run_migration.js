import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initial setup
const backendDir = path.resolve(__dirname, '..');
const devVarsPath = path.join(backendDir, '.dev.vars');
const migrationFile = path.join(backendDir, 'migrations', '01_add_is_admin_to_messages.sql');

console.log('🚀 Iniciando script de migração...');

// 1. Read .dev.vars to find DATABASE_URL
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    if (fs.existsSync(devVarsPath)) {
        console.log(`📄 Lendo variáveis de ${devVarsPath}...`);
        const content = fs.readFileSync(devVarsPath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
            const match = line.match(/^DATABASE_URL=(?:")?([^"]+)(?:")?$/);
            if (match) {
                dbUrl = match[1];
                console.log('✅ DATABASE_URL encontrada no .dev.vars');
                break;
            }
        }
    }
}

if (!dbUrl) {
    console.error('❌ ERRO: DATABASE_URL não encontrada. Defina no ambiente ou no arquivo .dev.vars');
    process.exit(1);
}

// 2. Read SQL file
if (!fs.existsSync(migrationFile)) {
    console.error(`❌ ERRO: Arquivo de migração não encontrado: ${migrationFile}`);
    process.exit(1);
}

const sql = fs.readFileSync(migrationFile, 'utf-8');
console.log('📄 SQL carregado.');

// 3. Connect and Execute
const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false } // Required for Neon/many cloud DBs
});

async function run() {
    try {
        const client = await pool.connect();
        console.log('🔌 Conectado ao banco de dados!');

        console.log('🔄 Executando migração...');
        await client.query(sql);

        console.log('✅ Migração executada com sucesso!');
        client.release();
    } catch (err) {
        if (err.code === '42701') {
            console.log('⚠️ Coluna já existe (Erro 42701). Migração já foi aplicada antes?');
        } else {
            console.error('❌ Erro na execução:', err);
        }
    } finally {
        await pool.end();
        console.log('👋 Conexão fechada.');
    }
}

run();
