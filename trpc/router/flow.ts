import { z } from 'zod';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';

export const flow = router({
    suggestions: protectedProcedure.input(z.string()).query(async ({ input }) => {
        return prisma.flow.findMany({
            where: {
                OR: [
                    {
                        title: {
                            contains: input,
                            mode: 'insensitive',
                        },
                    },
                    {
                        states: {
                            some: {
                                title: {
                                    contains: input,
                                    mode: 'insensitive',
                                },
                            },
                        },
                    },
                ],
            },
            include: {
                states: true,
            },
        });
    }),
    recommedations: protectedProcedure.query(async () => {
        return prisma.flow.findMany({
            where: {
                recommended: true,
            },
            include: {
                states: true,
            },
        });
    }),
    getById: protectedProcedure.input(z.string()).query(async ({ input }) => {
        return prisma.flow.findUnique({
            where: {
                id: input,
            },
            include: {
                states: true,
            },
        });
    }),
});
