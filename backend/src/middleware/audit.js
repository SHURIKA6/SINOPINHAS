import { queryDB } from '../db/index.js';
import { sendToDiscord } from '../utils/discord.js';
import { sendToGoogleSheets } from '../utils/google-sheets.js';
import { CRITICAL_AUDIT_ACTIONS } from '../utils/constants.js';

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

        // Persistência: Banco de Dados Postgres
        await queryDB(
            "INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)",
            [userId, action, JSON.stringify(finalDetails), ip.substring(0, 45), userAgent.substring(0, 255)],
            env
        );

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
        console.error("⚠️ Falha ao salvar log de auditoria:", err);
    }
}
