import { z } from 'zod';

export const tagCreateSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
});

export const tagSuggestionsSchema = z.object({
    query: z.string(),
    take: z.number().optional(),
    include: z.array(z.string()).optional(),
});

export type TagCreate = z.infer<typeof tagCreateSchema>;
