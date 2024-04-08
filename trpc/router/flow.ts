import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import { flowQuery } from '../queries/flow';

export const flow = router({
    suggestions: protectedProcedure.input(z.string()).query(async ({ input }) => {
        return flowQuery({ title: input }).groupBy('Flow.id').execute();
    }),
    recommedations: protectedProcedure.query(async () => {
        return flowQuery().execute();
    }),
    getById: protectedProcedure.input(z.string().optional()).query(async ({ input }) => {
        return flowQuery({ id: input }).executeTakeFirst();
    }),
});
