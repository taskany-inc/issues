import { TRPCError } from '@trpc/server';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { toggleReactionSchema } from '../../src/schema/reaction';

export const reaction = router({
    toggle: protectedProcedure
        .input(toggleReactionSchema)
        .mutation(async ({ ctx, input: { emoji, goalId, commentId } }) => {
            const isUserReaction = await prisma.reaction.findFirst({
                where: { emoji, goalId, commentId, activityId: ctx.session.user.activityId },
            });

            // TODO: call processEvent `toggle raection`

            try {
                if (isUserReaction) {
                    return prisma.reaction.delete({
                        where: {
                            id: isUserReaction.id,
                        },
                    });
                }

                return prisma.reaction.create({
                    data: {
                        emoji,
                        goalId,
                        commentId,
                        activityId: ctx.session.user.activityId,
                    },
                });
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
});
