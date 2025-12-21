import { queryDB } from '../db/index.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';

// Salvar subscrição de push
export const subscribe = async (c) => {
    const env = c.env;
    const payload = c.get('jwtPayload');

    if (!payload?.id) {
        return createErrorResponse(c, "UNAUTHORIZED", "Login necessário", 401);
    }

    try {
        const { subscription, deviceInfo } = await c.req.json();

        if (!subscription) {
            return createErrorResponse(c, "INVALID_INPUT", "Subscrição é obrigatória", 400);
        }

        await queryDB(
            `INSERT INTO push_subscriptions (user_id, subscription, device_info)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, subscription) DO NOTHING`,
            [payload.id, JSON.stringify(subscription), JSON.stringify(deviceInfo || {})],
            env
        );

        return createResponse(c, { success: true });
    } catch (err) {
        console.error("Erro ao salvar subscrição push:", err);
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao salvar subscrição", 500);
    }
};

// Remover subscrição (logout ou erro)
export const unsubscribe = async (c) => {
    const env = c.env;
    try {
        const { subscription } = await c.req.json();
        if (!subscription) return createResponse(c, { success: true });

        await queryDB(
            "DELETE FROM push_subscriptions WHERE subscription = $1",
            [JSON.stringify(subscription)],
            env
        );

        return createResponse(c, { success: true });
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao remover subscrição", 500);
    }
};
