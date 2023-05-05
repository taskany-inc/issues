import { z } from 'zod';

export const updateUserSchema = z.object({
    nickname: z.string().nullable(),
    name: z.string().nullable(),
});

export type UpdateUser = z.infer<typeof updateUserSchema>;

export const suggestionsUserSchema = z.object({
    query: z.string(),
    filter: z.array(z.string()).optional(),
});

export const settingsUserSchema = z.object({
    theme: z.string(),
});
