import { z } from 'zod';

export const videoMetadataSchema = z.object({
    title: z.string().min(3, "O título deve ter pelo menos 3 caracteres").max(100, "O título deve ter no máximo 100 caracteres"),
    description: z.string().max(1000, "A descrição deve ter no máximo 1000 caracteres").optional(),
    is_restricted: z.enum(['true', 'false']).transform(val => val === 'true'),
    type: z.enum(['video', 'photo']).optional().default('video')
});
