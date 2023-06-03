import z from 'zod';
import { TRPCError } from '@trpc/server';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { commentUpdateSchema } from '../../src/schema/comment';

export const comment = router({
    update: protectedProcedure.input(commentUpdateSchema).mutation(async ({ input: { id, description } }) => {
        try {
            const newComment = await prisma.comment.update({
                where: {
                    id,
                },
                data: {
                    description,
                },
            });

            return newComment;
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    delete: protectedProcedure.input(z.string()).mutation(async ({ input: id }) => {
        try {
            return prisma.comment.delete({
                where: {
                    id,
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
});
