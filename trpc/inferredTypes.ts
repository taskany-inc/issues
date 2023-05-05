import { inferRouterOutputs } from '@trpc/server';

import { TrpcRouter } from './router';

type RouterOutputs = inferRouterOutputs<TrpcRouter>;

export type FilterById = RouterOutputs['filter']['getById'];
