import { queryDB } from '../db/index.js';
import { createResponse, createErrorResponse } from '../utils/api-utils.js';

// Salvar subscrição de push
export const subscribe = async (c) => {
    const env = c.env;
    const payload = c.get('jwtPayload');

    if (payload?.id === undefined || payload?.id === null) {
        return createErrorResponse(c, "UNAUTHORIZED", "Login necessário", 401);
    }

    try {
        const { subscription, deviceInfo } = await c.req.json();

        if (!subscription) {
            return createErrorResponse(c, "INVALID_INPUT", "Subscrição é obrigatória", 400);
        }

        const endpoint = subscription.endpoint;

        await queryDB(
            `INSERT INTO push_subscriptions (user_id, endpoint, subscription, device_info)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (endpoint) DO UPDATE 
             SET user_id = EXCLUDED.user_id,
                 subscription = EXCLUDED.subscription,
                 device_info = EXCLUDED.device_info,
                 created_at = NOW()`,
            [payload.id, endpoint, JSON.stringify(subscription), JSON.stringify(deviceInfo || {})],
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
        const endpoint = subscription?.endpoint;
        if (!endpoint) return createResponse(c, { success: true });

        await queryDB(
            "DELETE FROM push_subscriptions WHERE endpoint = $1",
            [endpoint],
            env
        );

        return createResponse(c, { success: true });
    } catch (err) {
        return createErrorResponse(c, "INTERNAL_ERROR", "Erro ao remover subscrição", 500);
    }
};
