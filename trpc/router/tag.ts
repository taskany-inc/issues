import { z } from 'zod';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { tagCreateSchema, tagSuggestionsSchema } from '../../src/schema/tag';
import { tagQuery } from '../queries/tag';

export const tag = router({
    suggestions: protectedProcedure
        .input(tagSuggestionsSchema)
        .query(async ({ input: { query, take = 5, include } }) => {
            const requests = [
                tagQuery({
                    title: query,
                    limit: take,
                    excludedIds: include,
                }),
            ];

            if (include?.length) {
                requests.push(tagQuery({ id: include }));
            }

            return Promise.all(requests.map((req) => req.execute())).then(([suggest, included = []]) =>
                included.concat(suggest),
            );
        }),
    create: protectedProcedure.input(tagCreateSchema).mutation(({ ctx, input }) => {
        return prisma.tag.create({
            data: {
                ...input,
                activityId: ctx.session.user.activityId,
            },
        });
    }),
    getByIds: protectedProcedure.input(z.array(z.string())).query(({ input }) => {
        if (!input.length) {
            return [];
        }

        return tagQuery({ id: input }).execute();
    }),
});
