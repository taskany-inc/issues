import { inferRouterOutputs } from '@trpc/server';

import { TrpcRouter } from './router';

type RouterOutputs = inferRouterOutputs<TrpcRouter>;

export type FilterById = RouterOutputs['filter']['getById'];
export type ProjectByIdReturnType = RouterOutputs['project']['getById'];
export type ProjectUpdateReturnType = RouterOutputs['project']['update'];
export type ProjectCreateReturnType = RouterOutputs['project']['create'];
export type GoalByIdReturnType = RouterOutputs['goal']['getById'];
export type GoalBatchReturnType = RouterOutputs['goal']['getBatch'];
export type ActivityByIdReturnType = RouterOutputs['user']['suggestions'][number];
export type GoalAchiveCriteria = NonNullable<GoalByIdReturnType>['goalAchiveCriteria'][number];
export type GoalDependencyItem = NonNullable<NonNullable<GoalByIdReturnType>['_relations']>[number]['goals'][number];
export type GoalUpdateReturnType = RouterOutputs['goal']['update'];
export type GoalCreateReturnType = RouterOutputs['goal']['create'];
export type CommentCreateReturnType = RouterOutputs['goal']['createComment'];
export type PriorityReturnType = RouterOutputs['priority']['getAll'][number];
