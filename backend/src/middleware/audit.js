import { queryDB } from '../db/index.js';

export async function logAudit(userId, action, details = {}, c) {
    try {
        const env = c.env;
        const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
        const userAgent = c.req.header("User-Agent") || "unknown";

        await queryDB(
            "INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)",
            [userId, action, JSON.stringify(details), ip, userAgent],
            env
        );
    } catch (err) {
        console.error("⚠️ Falha ao salvar log de auditoria (ignorado):", err);
        // Não lança erro para não interromper o fluxo principal
    }
}
