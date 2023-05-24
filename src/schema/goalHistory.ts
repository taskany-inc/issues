import z from 'zod';

export const goalHistorySchema = z.object({
    goalId: z.string(),
    action: z.enum(['edit', 'remove', 'add', 'delete', 'archive', 'change']),
    subject: z.enum(['title', 'description', 'participants', 'state', 'tags']),
    nextValue: z.string(),
    previousValue: z.string().optional(),
});

export type GoalHistory = z.infer<typeof goalHistorySchema>;
