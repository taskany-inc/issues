import { z } from 'zod';

import { tr } from './schema.i18n';

export const criteriaSchema = z.object({
    title: z
        .string({
            required_error: tr('Title is required'),
        })
        .min(1, {
            message: tr('Title must be longer than 1 symbol'),
        }),
    weight: z.string().optional(),
    goalId: z.string(),
    goalAsGriteria: z
        .object({
            id: z.string(),
        })
        .optional(),
});

export const updateCriteriaState = z.object({
    id: z.string(),
    isDone: z.boolean(),
});

export const removeCriteria = z.object({
    id: z.string(),
});

export type AddCriteriaScheme = z.infer<typeof criteriaSchema>;
export type UpdateCriteriaScheme = z.infer<typeof updateCriteriaState>;
export type RemoveCriteriaScheme = z.infer<typeof removeCriteria>;
