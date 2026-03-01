import { queryDB } from '../db/index.js';
import { createErrorResponse } from '../utils/api-utils.js';
import { sanitize } from '../utils/sanitize.js';

// Constantes
const CACHE_TTL_SECONDS = 1800; // 30 minutos
const EVENTS_LOOKBACK_DAYS = 30;
const HTTP_CREATED = 201;
const HTTP_SERVER_ERROR = 500;

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
        const sql = `SELECT * FROM events WHERE date >= (CURRENT_DATE - INTERVAL '${EVENTS_LOOKBACK_DAYS} days') ORDER BY date ASC`;
        const result = await queryDB(sql, [], env);
        const events = result.rows;

        // 2. Cachear os resultados
        if (env?.MURAL_STORE && events.length > 0) {
            try {
                await env.MURAL_STORE.put(cacheKey, JSON.stringify(events), { expirationTtl: CACHE_TTL_SECONDS });
            } catch (e) {
                console.error("KV Write Error (Events):", e);
            }
        }

        return c.json(events);
    } catch (err) {
        console.error("Error fetching events:", err);
        return createErrorResponse(c, "FETCH_ERROR", "Erro ao carregar eventos", HTTP_SERVER_ERROR);
    }
};

// Função: Adicionar novo evento
export const addEvent = async (c) => {
    try {
        const { title, description, date, time, location, category, image, ticket_url } = await c.req.json();

        const sql = `
            INSERT INTO events (title, description, date, time, location, category, image, ticket_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const params = [sanitize(title), sanitize(description), date, time, sanitize(location), sanitize(category), image, ticket_url];
        const result = await queryDB(sql, params, c.env);

        // 2. Limpar cache ao adicionar novo evento
        if (c.env?.MURAL_STORE) {
            await c.env.MURAL_STORE.delete('events_data_sinop').catch(() => { });
        }

        return c.json(result.rows[0], HTTP_CREATED);
    } catch (err) {
        console.error("Error adding event:", err);
        return createErrorResponse(c, "CREATE_ERROR", "Erro ao criar evento", HTTP_SERVER_ERROR);
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
        return createErrorResponse(c, "DELETE_ERROR", "Erro ao deletar evento", HTTP_SERVER_ERROR);
    }
};
