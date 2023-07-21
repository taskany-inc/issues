import { z } from 'zod';

import { tr } from './schema.i18n';

export const createFeedbackSchema = z.object({
    title: z
        .string({
            required_error: tr('Title is required'),
            invalid_type_error: tr('Title must be a string'),
        })
        .min(3, {
            message: tr
                .raw('Title must be longer than {upTo} symbol', {
                    upTo: 3,
                })
                .join(''),
        }),
    description: z.string().optional(),
    href: z.string().optional(),
});

export type CreateFeedback = z.infer<typeof createFeedbackSchema>;
