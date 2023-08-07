import { z } from 'zod';

import { tr } from './schema.i18n';

export const commentSchema = z.object({
    description: z
        .string({
            required_error: tr("Comments's description is required"),
            invalid_type_error: tr("Comments's description must be a string"),
        })
        .min(1, {
            message: tr("Comments's description must be longer than 1 symbol"),
        }),
});

export type CommentSchema = z.infer<typeof commentSchema>;

export const commentEditSchema = commentSchema.extend({
    id: z.string(),
});

export type CommentEditSchema = z.infer<typeof commentEditSchema>;
