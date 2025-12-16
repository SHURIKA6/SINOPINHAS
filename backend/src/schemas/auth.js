import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().min(1, "Username é obrigatório"),
    password: z.string().min(1, "Senha é obrigatória")
});

export const registerSchema = z.object({
    username: z.string().min(4, "Username deve ter no mínimo 4 caracteres"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

export const updateProfileSchema = z.object({
    password: z.string().min(6).optional(),
    avatar: z.string().optional(),
    bio: z.string().max(200).optional()
});
