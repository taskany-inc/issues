import { inferAsyncReturnType } from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '../src/utils/auth';

export const createContext = async (opts: trpcNext.CreateNextContextOptions) => {
    const session = await getServerSession(opts.req, opts.res, authOptions);

    return { session, headers: opts.req.headers };
};

export type TrpcContext = inferAsyncReturnType<typeof createContext>;
