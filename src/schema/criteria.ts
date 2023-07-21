import { z } from 'zod';

import { tr } from './schema.i18n';

export const criteriaSchema = z.object({
    title: z
        .string({
            required_error: tr('Title is required'),
        })
        .min(1, {
            message: tr
                .raw('Title must be longer than {upTo} symbol', {
                    upTo: 1,
                })
                .join(''),
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
    goalId: z.string(),
});

export const convertCriteriaToGoalSchema = z.object({
    id: z.string(),
    title: z.string(),
    goalAsCriteria: z.object({
        id: z.string(),
    }),
});

export type AddCriteriaScheme = z.infer<typeof criteriaSchema>;
export type UpdateCriteriaScheme = z.infer<typeof updateCriteriaState>;
export type RemoveCriteriaScheme = z.infer<typeof removeCriteria>;
export type ConvertCriteriaToGoalScheme = z.infer<typeof convertCriteriaToGoalSchema>;
