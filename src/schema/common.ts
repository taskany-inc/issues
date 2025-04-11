import { StateType } from '@prisma/client';
import { z } from 'zod';

export const ToggleSubscriptionSchema = z.object({
    id: z.string().nullish(),
    direction: z.boolean().nullish(),
});

export const StateTypeEnum = z.nativeEnum(StateType);

export type ToggleSubscription = z.infer<typeof ToggleSubscriptionSchema>;

const sortDirectionValue = z.enum(['asc', 'desc']);
const sortGoalsPropEnum = z.enum([
    'title',
    'state',
    'priority',
    'project',
    'activity',
    'owner',
    'rank',
    'rankGlobal',
    'updatedAt',
    'createdAt',
    'estimate',
]);

const sortProjectsPropEnum = z.enum(['title', 'owner', 'updatedAt', 'createdAt', 'stargizers', 'watchers', 'goals']);

export const sortableGoalsPropertiesArraySchema = z
    .array(
        z.object({
            key: sortGoalsPropEnum,
            dir: sortDirectionValue,
        }),
    )
    .optional();

export const sortableProjectsPropertiesArraySchema = z
    .array(
        z.object({
            key: sortProjectsPropEnum,
            dir: sortDirectionValue,
        }),
    )
    .optional();

export type SortableProjectsPropertiesArray = z.infer<typeof sortableProjectsPropertiesArraySchema>;

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
    partnershipProject: z.array(z.string()).optional(),
    sort: sortableGoalsPropertiesArraySchema,
    query: z.string().optional(),
    starred: z.boolean().optional(),
    watching: z.boolean().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
    hideCriteria: z.boolean().optional(),
    hideEmptyProjects: z.boolean().optional(),
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
