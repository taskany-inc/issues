import { StateType } from '@prisma/client';
import { z } from 'zod';

export const ToggleSubscriptionSchema = z.object({
    id: z.string().nullish(),
    direction: z.boolean().nullish(),
});

export const StateTypeEnum = z.nativeEnum(StateType);

export type ToggleSubscription = z.infer<typeof ToggleSubscriptionSchema>;

const sortDirectionValue = z.enum(['asc', 'desc']);
const sortPropEnum = z.enum(['title', 'state', 'priority', 'project', 'activity', 'owner', 'updatedAt', 'createdAt']);

export const sortablePropertiesArraySchema = z
    .array(
        z.object({
            key: sortPropEnum,
            dir: sortDirectionValue,
        }),
    )
    .optional();

export const queryWithFiltersSchema = z.object({
    priority: z.array(z.string()).optional(),
    state: z.array(z.string()).optional(),
    stateType: z.array(StateTypeEnum).optional(),
    tag: z.array(z.string()).optional(),
    estimate: z.array(z.string()).optional(),
    issuer: z.array(z.string()).optional(),
    owner: z.array(z.string()).optional(),
    participant: z.array(z.string()).optional(),
    project: z.array(z.string()).optional(),
    sort: sortablePropertiesArraySchema,
    query: z.string().optional(),
    starred: z.boolean().optional(),
    watching: z.boolean().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
    hideCriteria: z.boolean().optional(),
});

export type QueryWithFilters = z.infer<typeof queryWithFiltersSchema>;

export const suggestionsQuerySchema = z.object({
    limit: z.number().optional(),
    input: z.string(),
    onlyCurrentUser: z.boolean().optional(),
    filter: z.string().array().optional(),
});

export type SuggestionsQuerySchema = z.infer<typeof suggestionsQuerySchema>;

export const batchGoalsSchema = z.object({
    query: queryWithFiltersSchema.optional(),
    baseQuery: queryWithFiltersSchema.optional(),
    limit: z.number(),
    cursor: z.string().nullish(),
    skip: z.number().optional(),
});

export type BatchGoalsSchema = z.infer<typeof batchGoalsSchema>;
