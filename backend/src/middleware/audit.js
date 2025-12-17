import { queryDB } from '../db/index.js';
import { sendToDiscord } from '../utils/discord.js';

export async function logAudit(userId, action, details = {}, c) {
    try {
        const env = c.env;
        const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
        const userAgent = c.req.header("User-Agent") || "unknown";

        // Captura dados geográficos precisos do Cloudflare
        const cf = c.req.raw?.cf || {};
        const geoInfo = {
            city: cf.city,
            country: cf.country,
            region: cf.region,
            latitude: cf.latitude,
            longitude: cf.longitude,
            postalCode: cf.postalCode,
            timezone: cf.timezone,
            colo: cf.colo,
            asn: cf.asn,
            org: cf.asOrganization
        };

        // Mescla geoInfo com os detalhes existentes
        const finalDetails = {
            ...details,
            server_geo: geoInfo
        };

        await queryDB(
            "INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)",
            [userId, action, JSON.stringify(finalDetails), ip, userAgent],
            env
        );

        // --- Active Observability (Discord) ---
        const criticalActions = ['VIDEO_DELETED', 'VIDEO_DELETED_R2', 'ADMIN_LOGIN_SUCCESS', 'ADMIN_USER_BANNED', 'ADMIN_PASSWORD_RESET'];
        if (criticalActions.includes(action)) {
            const emoji = action.includes('DELETE') ? '🗑️' : action.includes('BAN') ? '🚫' : '🛡️';
            const msg = `${emoji} **Alert: ${action}**\nUser: \`${userId || 'System/Admin'}\`\nIP: \`${ip}\`\nDetails: \`${JSON.stringify(details).slice(0, 100)}\``;
            c.executionCtx.waitUntil(sendToDiscord(msg, env));
        }

    } catch (err) {
        console.error("⚠️ Falha ao salvar log de auditoria (ignorado):", err);
        // Não lança erro para não interromper o fluxo principal
    }
}
