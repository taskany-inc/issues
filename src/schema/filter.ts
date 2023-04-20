import { z } from 'zod';

import { tr } from './schema.i18n';

export const createSchema = z.object({
    title: z
        .string({
            required_error: tr('Title is required'),
            invalid_type_error: tr('Title must be a string'),
        })
        .min(1, {
            message: tr('Title must be longer than 1 symbol'),
        }),
    mode: z.union([z.literal('Global'), z.literal('Project'), z.literal('User')]),
    params: z.string().min(1),
    description: z.string().optional(),
});

export type CreateFormType = z.infer<typeof createSchema>;
