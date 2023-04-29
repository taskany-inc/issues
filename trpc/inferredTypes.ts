import { inferRouterOutputs } from '@trpc/server';

import { TrpcRouter } from './routers/_trpcRouter';

type RouterOutputs = inferRouterOutputs<TrpcRouter>;

export type FilterById = RouterOutputs['filter']['getById'];
