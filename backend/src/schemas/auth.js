import { z } from 'zod';

export const registerSchema = z.object({
    username: z.string().min(3, "Username muito curto").max(20, "Username muito longo").regex(/^[a-zA-Z0-9_]+$/, "Username deve conter apenas letras, números e underline"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

export const loginSchema = z.object({
    username: z.string().min(1, "Username obrigatório"),
    password: z.string().min(1, "Senha obrigatória")
});

export const updateProfileSchema = z.object({
    password: z.string().min(6).optional(),
    avatar: z.string().url("Avatar deve ser uma URL válida").optional(),
    bio: z.string().max(200, "Bio muito longa").optional()
});
