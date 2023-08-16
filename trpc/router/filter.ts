import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { prisma } from '../../src/utils/prisma';
import { defaultFilterAlias } from '../../src/utils/defaultFilterAlias';
import { protectedProcedure, router } from '../trpcBackend';
import { connectionMap } from '../queries/connections';
import { createFilterSchema } from '../../src/schema/filter';
import { ToggleSubscriptionSchema } from '../../src/schema/common';

export const filter = router({
    getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
        const include = {
            stargizers: true,
            activity: {
                include: {
                    user: true,
                    ghost: true,
                },
            },
        };
        const filter =
            input === defaultFilterAlias
                ? await prisma.filter.findFirst({
                      where: {
                          default: true,
                      },
                      include,
                  })
                : await prisma.filter.findUnique({
                      where: {
                          id: input,
                      },
                      include,
                  });

        if (!filter) {
            throw new TRPCError({ code: 'NOT_FOUND', message: `No filter with id ${input}` });
        }

        return {
            ...filter,
            _isOwner: filter.activityId === ctx.session.user.activityId,
            _isStarred: filter.stargizers.some((stargizer) => stargizer.id === ctx.session.user.activityId),
        };
    }),
    getUserFilters: protectedProcedure.query(({ ctx }) => {
        const { activityId } = ctx.session.user;

        return prisma.filter.findMany({
            where: {
                OR: [
                    { activityId },
                    {
                        stargizers: {
                            some: {
                                id: activityId,
                            },
                        },
                    },
                    { mode: 'Global' },
                ],
            },
            include: {
                activity: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
            },
        });
    }),
    create: protectedProcedure.input(createFilterSchema).mutation(({ ctx, input }) => {
        return prisma.filter.create({ data: { ...input, activityId: ctx.session.user.activityId } });
    }),
    toggleStargizer: protectedProcedure
        .input(ToggleSubscriptionSchema)
        .mutation(({ ctx, input: { id, direction } }) => {
            const connection = { id };

            try {
                return prisma.activity.update({
                    where: { id: ctx.session.user.activityId },
                    data: {
                        filterStargizers: { [connectionMap[String(direction)]]: connection },
                    },
                });
            } catch (error: any) {
                throw new TRPCError({ code: 'CONFLICT', message: String(error.message), cause: error });
            }
        }),
    delete: protectedProcedure.input(z.string()).mutation(({ input }) => {
        try {
            return prisma.filter.delete({
                where: { id: input },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
});
