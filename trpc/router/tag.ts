import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { tagCreateSchema, tagSuggestionsSchema } from '../../src/schema/tag';

export const tag = router({
    suggestions: protectedProcedure
        .input(tagSuggestionsSchema)
        .query(async ({ input: { query, take = 5, include } }) => {
            return Promise.all([
                prisma.tag.findMany({
                    where: {
                        title: {
                            contains: query,
                            mode: 'insensitive',
                        },
                        ...(include
                            ? {
                                  id: {
                                      notIn: include,
                                  },
                              }
                            : {}),
                    },
                    take,
                }),
                include
                    ? prisma.tag.findMany({
                          where: {
                              id: {
                                  in: include,
                              },
                          },
                      })
                    : Promise.resolve([]),
            ]).then(([suggest, included]) => [...included, ...suggest]);
        }),
    create: protectedProcedure.input(tagCreateSchema).mutation(({ ctx, input }) => {
        return prisma.tag.create({
            data: {
                ...input,
                activityId: ctx.session.user.activityId,
            },
        });
    }),
});
