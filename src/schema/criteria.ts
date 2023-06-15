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
    weight: z
        .string({
            required_error: tr('Criteria Weight is required'),
        })
        .min(1, {
            message: tr('Criteria Weight must be longer than 1 symbol'),
        }),
    linkedGoalId: z.string(),
    goalAsGriteria: z.string().optional(),
});

export const updateCriteriaState = z.object({
    id: z.string(),
    isDone: z.boolean(),
});

export const removeCriteria = z.string();

export type AddCriteriaScheme = z.infer<typeof criteriaSchema>;
export type UpdateCriteriaScheme = z.infer<typeof updateCriteriaState>;
export type RemoveCriteriaScheme = z.infer<typeof removeCriteria>;
