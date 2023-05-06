import { z } from 'zod';

export const tagCreateSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
});

export type TagCreate = z.infer<typeof tagCreateSchema>;
