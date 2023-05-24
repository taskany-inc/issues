import { z } from 'zod';

export const ToggleSubscriptionSchema = z.object({
    id: z.string().nullish(),
    direction: z.boolean().nullish(),
});

export type ToggleSubscription = z.infer<typeof ToggleSubscriptionSchema>;

export const sortablePropertiesSchema = z
    .object({
        title: z.string().optional(),
        state: z.string().optional(),
        priority: z.string().optional(),
        project: z.string().optional(),
        activity: z.string().optional(),
        owner: z.string().optional(),
        updatedAt: z.string().optional(),
        createdAt: z.string().optional(),
    })
    .optional();

export const queryWithFiltersSchema = z.object({
    priority: z.array(z.string()).optional(),
    state: z.array(z.string()).optional(),
    tag: z.array(z.string()).optional(),
    estimate: z.array(z.string()).optional(),
    owner: z.array(z.string()).optional(),
    project: z.array(z.string()).optional(),
    sort: sortablePropertiesSchema,
    query: z.string().optional(),
});

export type QueryWithFilters = z.infer<typeof queryWithFiltersSchema>;
