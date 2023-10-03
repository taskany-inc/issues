import { TRPCError, initTRPC } from '@trpc/server';

import { transformer } from '../src/utils/transformer';

import type { TrpcContext } from './context';

const t = initTRPC.context<TrpcContext>().create({
    transformer,
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

export const { middleware } = t;
export const { router, procedure } = t;
