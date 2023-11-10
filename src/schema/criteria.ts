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
    goalAsCriteria: z.object({
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
export interface ValidityData {
    sum: number;
    title: string[];
}

export interface ValidityMessage {
    uniqueTitle: string;
    notInRange: string;
    weigthIsNan: string;
}

export const maxPossibleWeight = 100;
export const minPossibleWeight = 1;

export function patchZodSchema<
    T extends typeof criteriaSchema | typeof updateCriteriaSchema | typeof connectedGoalAsCriteria,
>(schema: T, data: ValidityData, messages: ValidityMessage) {
    const patched = schema.merge(
        z.object({
            title: schema.shape.title.refine((val) => !data.title.some((t) => t === val), {
                message: messages.uniqueTitle,
            }),
            // INFO: https://github.com/colinhacks/zod#abort-early
            weight: schema.shape.weight.superRefine((val, ctx): val is string => {
                if (!val || !val.length) {
                    return z.NEVER;
                }

                const parsed = Number(val);

                if (Number.isNaN(parsed)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: messages.weigthIsNan,
                    });
                }

                if (parsed < minPossibleWeight || data.sum + parsed > maxPossibleWeight) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: messages.notInRange,
                    });
                }

                return z.NEVER;
            }),
        }),
    );

    return patched;
}
