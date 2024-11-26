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
    criteriaGoal: z
        .object({
            id: z.string(),
        })
        .optional(),
    externalTask: z
        .object({
            taskKey: z.string(),
        })
        .optional(),
});

export const updateCriteriaSchema = criteriaSchema.merge(
    z.object({
        id: z.string(),
    }),
);

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
    criteriaGoal: z.object({
        id: z.string(),
    }),
});

export const connectedGoalAsCriteria = z.object({
    title: z.string(),
    targetId: z.string(),
    goalId: z.string(),
    weight: z.string().optional(),
});

export type AddCriteriaSchema = z.infer<typeof criteriaSchema>;
export type UpdateCriteriaStateSchema = z.infer<typeof updateCriteriaState>;
export type UpdateCriteriaSchema = z.infer<typeof updateCriteriaSchema>;
export type RemoveCriteriaSchema = z.infer<typeof removeCriteria>;
export type ConvertCriteriaToGoalSchema = z.infer<typeof convertCriteriaToGoalSchema>;
export type ConnectedGoalAsCriteria = z.infer<typeof connectedGoalAsCriteria>;
