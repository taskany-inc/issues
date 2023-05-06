import { z } from 'zod';

import { tr } from './schema.i18n';

export const commentCreateSchema = z.object({
    description: z
        .string({
            required_error: tr("Comments's description is required"),
            invalid_type_error: tr("Comments's description must be a string"),
        })
        .min(1, {
            message: tr("Comments's description must be longer than 1 symbol"),
        }),
    goalId: z.string().min(1),
});

export type CommentCreate = z.infer<typeof commentCreateSchema>;

export const commentUpdateSchema = z.object({
    id: z.string().min(1),
    description: z
        .string({
            required_error: tr("Comments's description is required"),
            invalid_type_error: tr("Comments's description must be a string"),
        })
        .min(1, {
            message: tr("Comments's description must be longer than 1 symbol"),
        }),
});

export type CommentUpdate = z.infer<typeof commentUpdateSchema>;
