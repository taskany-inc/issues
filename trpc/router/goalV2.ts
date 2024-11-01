import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import { getDeepParentGoalIds, getDeepChildrenGoalIds } from '../queries/goalV2';
import { goalEditAccessMiddleware } from '../access/accessMiddlewares';
import { db } from '../connection/kysely';
import { getMiddleRank } from '../../src/utils/ranking';
import { getGoalRank, updateGoalRank } from '../queries/ranking';

import { tr } from './router.i18n';

export const goal = router({
    getParentIds: protectedProcedure.input(z.string().array()).query(async ({ input }) => {
        return getDeepParentGoalIds(input).execute();
    }),

    getChildrenIds: protectedProcedure.input(z.string().array()).query(async ({ input }) => {
        return getDeepChildrenGoalIds(input).execute();
    }),

    updateRank: protectedProcedure
        .input(z.object({ id: z.string(), low: z.string().optional(), high: z.string().optional() }))
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
            const [low, high] = await Promise.all([
                input.low ? getGoalRank(ctx.session.user.activityId, input.low).executeTakeFirst() : undefined,
                input.high ? getGoalRank(ctx.session.user.activityId, input.high).executeTakeFirst() : undefined,
            ]);
            const newRank = getMiddleRank({ low: low?.value, high: high?.value });
            await updateGoalRank([
                { activityId: ctx.session.user.activityId, goalId: input.id, value: newRank },
            ]).execute();
        }),
});
