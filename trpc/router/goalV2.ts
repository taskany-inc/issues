import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import { getDeepParentGoalIds, getDeepChildrenGoalIds } from '../queries/goalV2';
import { goalEditAccessMiddleware } from '../access/accessMiddlewares';
import { db } from '../connection/kysely';
import { getMiddleRank } from '../../src/utils/ranking';
import { getGoalRank, updateGoalRanks } from '../queries/ranking';

import { tr } from './router.i18n';

export const goal = router({
    getParentIds: protectedProcedure.input(z.string().array()).query(async ({ input }) => {
        return getDeepParentGoalIds(input).execute();
    }),

    getChildrenIds: protectedProcedure.input(z.string().array()).query(async ({ input }) => {
        return getDeepChildrenGoalIds(input).execute();
    }),

    updateRank: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                low: z.string().optional(),
                high: z.string().optional(),
                global: z.boolean(),
            }),
        )
        .use(goalEditAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            const { projectId } = await db
                .selectFrom('Goal')
                .where('id', '=', input.id)
                .select(['projectId'])
                .executeTakeFirstOrThrow();
            if (!projectId) {
                throw new TRPCError({ code: 'PRECONDITION_FAILED', message: tr("Goal doesn't have a project") });
            }
            const activityId = input.global ? undefined : ctx.session.user.activityId;
            const [low, high] = await Promise.all([
                input.low ? getGoalRank(input.low, activityId).executeTakeFirst() : undefined,
                input.high ? getGoalRank(input.high, activityId).executeTakeFirst() : undefined,
            ]);
            const newRank = getMiddleRank({ low: low?.value, high: high?.value });
            console.log({ low: low?.value, newRank, high: high?.value, activityId });
            await updateGoalRanks([{ goalId: input.id, value: newRank }], activityId).execute();
        }),
});
