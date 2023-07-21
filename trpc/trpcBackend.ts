import { TRPCError, initTRPC } from '@trpc/server';
import superjson from 'superjson';

import type { TrpcContext } from './context';

const t = initTRPC.context<TrpcContext>().create({
    transformer: superjson,
});

const sessionCheck = t.middleware(({ next, ctx }) => {
    const { session } = ctx;

    if (!session) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
        });
    }

    return next({
        ctx: { session, headers: ctx.headers },
    });
});

export const protectedProcedure = t.procedure.use(sessionCheck);

export const { router, procedure } = t;
