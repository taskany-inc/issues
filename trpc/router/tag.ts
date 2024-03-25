import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { tagCreateSchema, tagSuggestionsSchema } from '../../src/schema/tag';

export const tag = router({
    suggestions: protectedProcedure
        .input(tagSuggestionsSchema)
        .query(async ({ input: { query, take = 5, include } }) => {
            const where: Prisma.TagWhereInput = {
                title: {
                    contains: query,
                    mode: 'insensitive',
                },
            };

            if (include) {
                where.id = {
                    notIn: include,
                };
            }

            const schema = {
                where,
                take,
            };

            const request = [prisma.tag.findMany(schema)];

            if (include) {
                request.push(
                    prisma.tag.findMany({
                        where: {
                            id: {
                                in: include,
                            },
                        },
                    }),
                );
            }

            return Promise.all(request).then(([suggest, included = []]) => [...included, ...suggest]);
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
        return prisma.tag.findMany({
            where: {
                id: {
                    in: input,
                },
            },
        });
    }),
});
