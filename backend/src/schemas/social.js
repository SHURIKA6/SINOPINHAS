import { z } from 'zod';

export const commentSchema = z.object({
    video_id: z.string().uuid("ID de vídeo inválido").or(z.number()),
    user_id: z.string().or(z.number()),
    comment: z.string().min(1, "Comentário não pode ser vazio").max(500, "Comentário muito longo")
});

export const sendMessageSchema = z.object({
    from_id: z.string().or(z.number()),
    to_id: z.string().or(z.number()),
    msg: z.string().min(1, "Mensagem vazia").max(1000, "Mensagem muito longa")
});
