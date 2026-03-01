import { queryDB } from '../db/index.js';
import { sendToDiscord } from '../utils/discord.js';
import { sendToGoogleSheets } from '../utils/google-sheets.js';
import { CRITICAL_AUDIT_ACTIONS } from '../utils/constants.js';

const CREATE_AUDIT_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action TEXT NOT NULL,
        details JSONB,
        ip_address VARCHAR(50),
        user_agent VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
    )
`;

async function insertAuditLog(userId, action, detailsJson, ip, userAgent, env) {
    return queryDB(
        "INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)",
        [userId, action, detailsJson, ip.substring(0, 45), userAgent.substring(0, 255)],
        env
    );
}

export async function logAudit(userId, action, details = {}, c) {
    try {
        const env = c.env;
        const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
        const userAgent = c.req.header("User-Agent") || "unknown";
        const platform = c.req.header("sec-ch-ua-platform") || "unknown";
        const mobile = c.req.header("sec-ch-ua-mobile") || "unknown";
        const rayId = c.req.header("cf-ray") || "unknown";

        // Função: Capturar metadados geográficos via Cloudflare
        const cf = c.req.raw?.cf || {};
        const geoInfo = {
            city: cf.city || "Unknown City",
            country: cf.country || "XX",
            region: cf.region || "Unknown Region",
            latitude: cf.latitude || 0,
            longitude: cf.longitude || 0,
            timezone: cf.timezone || "UTC",
            asn: cf.asn || 0,
            asOrganization: cf.asOrganization || "Unknown ISP"
        };

        // Função: Consolidar detalhes par audit log (inclui impressão digital)
        const finalDetails = {
            ...details,
            ...geoInfo,
            ip,
            user_agent: userAgent,
            platform,
            is_mobile: mobile,
            ray_id: rayId,
            fingerprint_raw: `${ip}|${userAgent}|${cf.country}|${cf.city}` // Fingerprint simples de backend
        };

        const detailsJson = JSON.stringify(finalDetails);

        // Persistência: Banco de Dados Postgres (com auto-repair)
        try {
            await insertAuditLog(userId, action, detailsJson, ip, userAgent, env);
        } catch (dbErr) {
            console.warn(`⚠️ Audit INSERT falhou (${dbErr.code}): ${dbErr.message}. Tentando auto-repair...`);

            // Tabela não existe — criar e tentar de novo
            if (dbErr.code === '42P01') {
                await queryDB(CREATE_AUDIT_TABLE_SQL, [], env);
                console.warn('✅ Tabela audit_logs criada automaticamente.');
                await insertAuditLog(userId, action, detailsJson, ip, userAgent, env);
            }
            // Coluna ausente — tentar adicionar colunas comuns e reinserir
            else if (dbErr.code === '42703') {
                await queryDB("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB", [], env);
                await queryDB("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50)", [], env);
                await queryDB("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent VARCHAR(255)", [], env);
                console.warn('✅ Colunas reparadas em audit_logs.');
                await insertAuditLog(userId, action, detailsJson, ip, userAgent, env);
            }
            // Tipo incompatível (ex: details era TEXT e agora é JSONB)
            else if (dbErr.code === '42804' || dbErr.message?.includes('type')) {
                console.warn('⚠️ Tentando inserir details como TEXT...');
                await queryDB(
                    "INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent) VALUES ($1, $2, $3::text, $4, $5)",
                    [userId, action, detailsJson, ip.substring(0, 45), userAgent.substring(0, 255)],
                    env
                );
            }
            else {
                // Erro desconhecido — logar mas não perder silenciosamente
                console.error(`🔥 Audit log PERDIDO para action=${action}, user=${userId}:`, dbErr.message);
            }
        }

        // --- Tarefas Assíncronas (Execução em Background) ---

        // 1. Integração Google Sheets
        c.executionCtx.waitUntil(sendToGoogleSheets('audit_logs', {
            userId,
            action,
            ...finalDetails,
            created_at: new Date().toISOString()
        }, env));

        // 2. Alertas Críticos (Discord)
        const criticalActions = CRITICAL_AUDIT_ACTIONS;
        if (criticalActions.includes(action)) {
            const emoji = action.includes('DELETE') ? '🗑️' : action.includes('BAN') ? '🚫' : '🛡️';
            const msg = `${emoji} **Audit Alert: ${action}**\nUser: \`${userId || 'System'}\`\nIP: \`${ip}\`\nGeo: \`${geoInfo.city}, ${geoInfo.country}\``;
            c.executionCtx.waitUntil(sendToDiscord(msg, env));
        }

    } catch (err) {
        console.error("🔥 Falha CRÍTICA no sistema de auditoria:", err);
    }
}

