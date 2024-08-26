import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import { getDeepParentGoalIds, getDeepChildrenGoalIds } from '../queries/goalV2';

export const goal = router({
    getParentIds: protectedProcedure.input(z.string().array()).query(async ({ input }) => {
        return getDeepParentGoalIds(input).execute();
    }),

    getChildrenIds: protectedProcedure.input(z.string().array()).query(async ({ input }) => {
        return getDeepChildrenGoalIds(input).execute();
    }),
});
