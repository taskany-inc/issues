import z from 'zod';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { tagCreateSchema } from '../../src/schema/tag';

export const tag = router({
    suggestions: protectedProcedure.input(z.string()).query(async ({ input }) => {
        return prisma.tag.findMany({
            where: {
                title: {
                    contains: input,
                    mode: 'insensitive',
                },
            },
            take: 5,
        });
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
