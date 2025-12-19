import { queryDB } from '../db/index.js';
import { createErrorResponse } from '../utils/api-utils.js';

export const getEvents = async (c) => {
    try {
        const sql = `SELECT * FROM events ORDER BY date ASC`;
        const result = await queryDB(sql, [], c.env);
        return c.json(result.rows);
    } catch (err) {
        console.error("Error fetching events:", err);
        return createErrorResponse(c, "FETCH_ERROR", "Erro ao carregar eventos", 500);
    }
};

export const addEvent = async (c) => {
    try {
        // Simple auth check for admin (based on password in body)
        const { title, description, date, time, location, category, image, adminPassword } = await c.req.json();

        if (adminPassword !== c.env.ADMIN_PASSWORD) {
            return createErrorResponse(c, "UNAUTHORIZED", "Não autorizado", 401);
        }

        const sql = `
            INSERT INTO events (title, description, date, time, location, category, image)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const params = [title, description, date, time, location, category, image];
        const result = await queryDB(sql, params, c.env);

        return c.json(result.rows[0], 201);
    } catch (err) {
        console.error("Error adding event:", err);
        return createErrorResponse(c, "CREATE_ERROR", "Erro ao criar evento", 500);
    }
};

export const deleteEvent = async (c) => {
    try {
        const id = c.req.param('id');
        const { adminPassword } = await c.req.json();

        if (adminPassword !== c.env.ADMIN_PASSWORD) {
            return createErrorResponse(c, "UNAUTHORIZED", "Não autorizado", 401);
        }

        await queryDB('DELETE FROM events WHERE id = $1', [id], c.env);
        return c.json({ success: true });
    } catch (err) {
        return createErrorResponse(c, "DELETE_ERROR", "Erro ao deletar evento", 500);
    }
};
