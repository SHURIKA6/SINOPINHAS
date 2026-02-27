import { queryDB } from '../db/index.js';
import { createErrorResponse } from '../utils/api-utils.js';

// Função: Listar eventos (com cache)
export const getEvents = async (c) => {
    const env = c.env;
    const cacheKey = 'events_data_sinop';

    // 1. Tentar Cache
    if (env?.MURAL_STORE) {
        try {
            const cached = await env.MURAL_STORE.get(cacheKey);
            if (cached) {
                return c.json(JSON.parse(cached));
            }
        } catch (e) {
            console.error("KV Read Error (Events):", e);
        }
    }

    try {
        // Obter apenas eventos a partir de hoje
        const sql = `SELECT * FROM events WHERE date >= CURRENT_DATE ORDER BY date ASC`;
        const result = await queryDB(sql, [], env);
        const events = result.rows;

        // 2. Cachear os resultados (30 minutos)
        if (env?.MURAL_STORE && events.length > 0) {
            try {
                await env.MURAL_STORE.put(cacheKey, JSON.stringify(events), { expirationTtl: 1800 });
            } catch (e) {
                console.error("KV Write Error (Events):", e);
            }
        }

        return c.json(events);
    } catch (err) {
        console.error("Error fetching events:", err);
        return createErrorResponse(c, "FETCH_ERROR", "Erro ao carregar eventos", 500);
    }
};

// Função: Adicionar novo evento
export const addEvent = async (c) => {
    try {
        // Simple auth check for admin (based on password in body)
        const { title, description, date, time, location, category, image, ticket_url } = await c.req.json();

        const sql = `
            INSERT INTO events (title, description, date, time, location, category, image, ticket_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const params = [title, description, date, time, location, category, image, ticket_url];
        const result = await queryDB(sql, params, c.env);

        // 2. Limpar cache ao adicionar novo evento
        if (c.env?.MURAL_STORE) {
            await c.env.MURAL_STORE.delete('events_data_sinop').catch(() => { });
        }

        return c.json(result.rows[0], 201);
    } catch (err) {
        console.error("Error adding event:", err);
        return createErrorResponse(c, "CREATE_ERROR", "Erro ao criar evento", 500);
    }
};

// Função: Deletar evento existente
export const deleteEvent = async (c) => {
    try {
        const id = c.req.param('id');

        await queryDB('DELETE FROM events WHERE id = $1', [id], c.env);

        // 2. Limpar cache ao deletar evento
        if (c.env?.MURAL_STORE) {
            await c.env.MURAL_STORE.delete('events_data_sinop').catch(() => { });
        }

        return c.json({ success: true });
    } catch (err) {
        return createErrorResponse(c, "DELETE_ERROR", "Erro ao deletar evento", 500);
    }
};
