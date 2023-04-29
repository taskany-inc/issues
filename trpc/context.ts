import { inferAsyncReturnType } from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '../src/utils/auth';

export const createContext = async (opts: trpcNext.CreateNextContextOptions) => {
    const session = await getServerSession(opts.req, opts.res, authOptions);

    return { session };
};

export type TrpcContext = inferAsyncReturnType<typeof createContext>;
