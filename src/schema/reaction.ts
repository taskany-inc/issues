import { z } from 'zod';

export const toggleReactionSchema = z.object({
    emoji: z.string(),
    goalId: z.string().optional(),
    commentId: z.string().optional(),
});

export type ToggleReaction = z.infer<typeof toggleReactionSchema>;
