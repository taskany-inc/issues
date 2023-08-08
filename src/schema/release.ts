import { z } from 'zod';

export const releaseSchema = z.object({
    version: z.string(),
});

export type ReleaseReaction = z.infer<typeof releaseSchema>;
