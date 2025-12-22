import { queryDB } from '../db/index.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';

// Enviar mensagem para o log do Shura
export const submitShuraMessage = async (c) => {
    const env = c.env;
    try {
        const { message } = await c.req.json();
        const payload = c.get('jwtPayload');
        const userId = payload?.id;

        if (!userId) return createErrorResponse(c, "UNAUTHORIZED", "Você precisa estar logado", 401);
        if (!message || message.trim().length === 0) return createErrorResponse(c, "INVALID_INPUT", "Mensagem vazia", 400);

        await queryDB(
            "INSERT INTO shura_messages (user_id, message) VALUES ($1, $2)",
            [userId, message],
            env
        );

        return createResponse(c, { success: true, message: "Sua mensagem foi enviada e aguarda aprovação!" });
    } catch (err) {
        return createErrorResponse(c, "DB_ERROR", err.message, 500);
    }
};

// Listar mensagens aprovadas (público do log)
export const getApprovedShuraMessages = async (c) => {
    const env = c.env;
    try {
        const { rows } = await queryDB(
            `SELECT m.message, u.username, m.created_at 
             FROM shura_messages m 
             JOIN users u ON m.user_id = u.id 
             WHERE m.is_approved = TRUE 
             ORDER BY m.created_at DESC LIMIT 50`,
            [],
            env
        );
        return createResponse(c, rows);
    } catch (err) {
        return createResponse(c, []);
    }
};

// Listar todas as mensagens (Admin)
export const getAllShuraMessages = async (c) => {
    const env = c.env;
    try {
        const { rows } = await queryDB(
            `SELECT m.*, u.username 
             FROM shura_messages m 
             JOIN users u ON m.user_id = u.id 
             ORDER BY m.created_at DESC`,
            [],
            env
        );
        return createResponse(c, rows);
    } catch (err) {
        return createResponse(c, []);
    }
};

// Aprovar/Reprovar mensagem (Admin)
export const toggleApproveShuraMessage = async (c) => {
    const env = c.env;
    const { id, approved } = await c.req.json();
    try {
        await queryDB(
            "UPDATE shura_messages SET is_approved = $1 WHERE id = $2",
            [approved, id],
            env
        );
        return createResponse(c, { success: true });
    } catch (err) {
        return createErrorResponse(c, "DB_ERROR", err.message, 500);
    }
};

// Buscar logs do sistema (Audit) formatados para o Shura Logs
export const getSystemAuditLogs = async (c) => {
    const env = c.env;
    try {
        const { rows } = await queryDB(
            `SELECT a.action, u.username, a.created_at, 
                    a.details->>'os' as os, a.details->>'browser' as browser,
                    a.details->>'city' as city, a.details->>'country' as country
             FROM audit_logs a 
             LEFT JOIN users u ON a.user_id = u.id 
             ORDER BY a.created_at DESC LIMIT 40`,
            [],
            env
        );
        return createResponse(c, rows);
    } catch (err) {
        return createResponse(c, []);
    }
};

// Deletar mensagem (Admin)
export const deleteShuraMessage = async (c) => {
    const env = c.env;
    const id = c.req.param("id");
    try {
        await queryDB("DELETE FROM shura_messages WHERE id = $1", [id], env);
        return createResponse(c, { success: true });
    } catch (err) {
        return createErrorResponse(c, "DB_ERROR", err.message, 500);
    }
};
