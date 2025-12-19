import { queryDB } from '../db/index.js';
import { createErrorResponse } from '../utils/api-utils.js';

export const getPlaces = async (c) => {
    try {
        const sql = `SELECT * FROM places ORDER BY title ASC`;
        const result = await queryDB(sql, [], c.env);
        return c.json(result.rows);
    } catch (err) {
        console.error("Error fetching places:", err);
        return createErrorResponse(c, "FETCH_ERROR", "Erro ao carregar lugares", 500);
    }
};

export const addPlace = async (c) => {
    try {
        const { title, description, category, image, link, adminPassword } = await c.req.json();

        if (adminPassword !== c.env.ADMIN_PASSWORD) {
            return createErrorResponse(c, "UNAUTHORIZED", "Não autorizado", 401);
        }

        const sql = `
            INSERT INTO places (title, description, category, image, link)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const params = [title, description, category, image, link];
        const result = await queryDB(sql, params, c.env);

        return c.json(result.rows[0], 201);
    } catch (err) {
        console.error("Error adding place:", err);
        return createErrorResponse(c, "CREATE_ERROR", "Erro ao criar lugar", 500);
    }
};

export const deletePlace = async (c) => {
    try {
        const id = c.req.param('id');
        const { adminPassword } = await c.req.json();

        if (adminPassword !== c.env.ADMIN_PASSWORD) {
            return createErrorResponse(c, "UNAUTHORIZED", "Não autorizado", 401);
        }

        await queryDB('DELETE FROM places WHERE id = $1', [id], c.env);
        return c.json({ success: true });
    } catch (err) {
        return createErrorResponse(c, "DELETE_ERROR", "Erro ao deletar lugar", 500);
    }
};
