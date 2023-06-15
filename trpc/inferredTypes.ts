import { inferRouterOutputs } from '@trpc/server';

import { TrpcRouter } from './router';

type RouterOutputs = inferRouterOutputs<TrpcRouter>;

export type FilterById = RouterOutputs['filter']['getById'];
export type ProjectByIdReturnType = RouterOutputs['project']['getById'];
export type ProjectUpdateReturnType = RouterOutputs['project']['update'];
export type GoalByIdReturnType = RouterOutputs['goal']['getById'];
export type ActivityByIdReturnType = RouterOutputs['user']['suggestions'][number];
export type GoalEstimate = NonNullable<GoalByIdReturnType>['_lastEstimate'];
export type GoalAchiveCriteria = NonNullable<GoalByIdReturnType>['goalAchiveCriteria'][number];
