import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { connectionMap } from '../queries/connections';
import { createFilterSchema } from '../../src/schema/filter';
import { ToggleSubscriptionSchema } from '../../src/schema/common';
import { filterQuery } from '../queries/filter';

import { tr } from './router.i18n';

export const filter = router({
    getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
        const filter = await filterQuery({ id: input }).executeTakeFirst();

        if (!filter) {
            throw new TRPCError({ code: 'NOT_FOUND', message: tr('No filter with id', { id: input }) });
        }

        return {
            ...filter,
            _isOwner: filter.activityId === ctx.session.user.activityId,
            _isStarred: filter.stargizers.some((stargizer) => stargizer.id === ctx.session.user.activityId),
        };
    }),
    getDefaultFilter: protectedProcedure.query(async ({ ctx }) => {
        const filter = await filterQuery({ isDefault: true }).executeTakeFirst();

        if (!filter) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'No default filters' });
        }

        return {
            ...filter,
            _isOwner: false,
            _isStarred: filter.stargizers.some((stargizer) => stargizer.id === ctx.session.user.activityId),
        };
    }),
    getUserFilters: protectedProcedure.query(async ({ ctx }) => {
        const filter = await filterQuery({ activityId: ctx.session.user.activityId }).execute();

        return filter;
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
