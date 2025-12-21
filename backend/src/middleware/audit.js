import { queryDB } from '../db/index.js';
import { sendToDiscord } from '../utils/discord.js';
import { sendToGoogleSheets } from '../utils/google-sheets.js';

export async function logAudit(userId, action, details = {}, c) {
    try {
        const env = c.env;
        const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
        const userAgent = c.req.header("User-Agent") || "unknown";

        // Captura dados geográficos do Cloudflare
        const cf = c.req.raw?.cf || {};
        const geoInfo = {
            city: cf.city || "N/A",
            country: cf.country || "N/A",
            region: cf.region || "N/A",
            latitude: cf.latitude || "N/A",
            longitude: cf.longitude || "N/A"
        };

        // Mescla geoInfo com os detalhes existentes (impressão digital do frontend, etc)
        const finalDetails = {
            ...details,
            ...geoInfo,
            ip,
            user_agent: userAgent
        };

        // Salva no Banco de Dados
        await queryDB(
            "INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)",
            [userId, action, JSON.stringify(finalDetails), ip, userAgent],
            env
        );

        // --- Atividades em Segundo Plano (WaitUntil) ---

        // 1. Sincronizar com Google Sheets
        c.executionCtx.waitUntil(sendToGoogleSheets({
            userId,
            action,
            ...finalDetails,
            created_at: new Date().toISOString()
        }, env));

        // 2. Observabilidade Ativa (Discord)
        const criticalActions = ['VIDEO_DELETED', 'VIDEO_DELETED_R2', 'ADMIN_LOGIN_SUCCESS', 'ADMIN_USER_BANNED', 'ADMIN_PASSWORD_RESET'];
        if (criticalActions.includes(action)) {
            const emoji = action.includes('DELETE') ? '🗑️' : action.includes('BAN') ? '🚫' : '🛡️';
            const msg = `${emoji} **Audit Alert: ${action}**\nUser: \`${userId || 'System'}\`\nIP: \`${ip}\`\nGeo: \`${geoInfo.city}, ${geoInfo.country}\``;
            c.executionCtx.waitUntil(sendToDiscord(msg, env));
        }

    } catch (err) {
        console.error("⚠️ Falha ao salvar log de auditoria:", err);
    }
}
