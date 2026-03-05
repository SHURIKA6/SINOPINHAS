import { z } from 'zod';

// --- Constantes de Validação ---
const COMMENT_MIN_LENGTH = 1;
const COMMENT_MAX_LENGTH = 500;
const MESSAGE_MIN_LENGTH = 1;
const MESSAGE_MAX_LENGTH = 1000;

export const commentSchema = z.object({
    video_id: z.coerce.number().int().positive("ID de vídeo inválido"),
    comment: z.string().min(COMMENT_MIN_LENGTH, "Comentário não pode ser vazio").max(COMMENT_MAX_LENGTH, "Comentário muito longo")
});

export const sendMessageSchema = z.object({
    to_id: z.string().or(z.number()),
    msg: z.string().min(MESSAGE_MIN_LENGTH, "Mensagem vazia").max(MESSAGE_MAX_LENGTH, "Mensagem muito longa")
});
