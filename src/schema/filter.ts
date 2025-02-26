import { FilterMode } from '@prisma/client';
import { z } from 'zod';

import { tr } from './schema.i18n';

export const createFilterSchema = z.object({
    title: z
        .string({
            required_error: tr('Title is required'),
            invalid_type_error: tr('Title must be a string'),
        })
        .min(1, {
            message: tr
                .raw('Title must be longer than {upTo} symbol', {
                    upTo: 1,
                })
                .join(''),
        }),
    mode: z.nativeEnum(FilterMode),
    params: z.string().min(1),
    target: z.string(),
    description: z.string().optional(),
});

export type CreateFilter = z.infer<typeof createFilterSchema>;
