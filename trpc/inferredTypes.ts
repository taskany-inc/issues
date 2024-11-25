import { inferRouterOutputs } from '@trpc/server';

import { DB } from '../generated/kysely/types';

import { TrpcRouter } from './router';
import { ExtractTypeFromGenerated } from './utils';

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
export type GoalChangeProjectReturnType = RouterOutputs['goal']['changeProject'];
export type GoalUpdateReturnType = RouterOutputs['goal']['update'];
export type GoalCreateReturnType = RouterOutputs['goal']['create'];
export type CommentCreateReturnType = RouterOutputs['goal']['createComment'];
export type PriorityReturnType = RouterOutputs['priority']['getAll'][number];
export type TeamSuggetionsReturnType = RouterOutputs['crew']['teamSuggetions'][number];
export type State = RouterOutputs['state']['all'][number];
export type StateType = State['type'];

export type DashboardProjectV2 = RouterOutputs['v2']['project']['getUserDashboardProjects']['groups'][number];
export type DashboardGoalV2 = NonNullable<DashboardProjectV2['goals']>[number];
export type ProjectByIdReturnTypeV2 = RouterOutputs['v2']['project']['getById'];
export type ProjectChildrenTree = RouterOutputs['v2']['project']['getProjectChildrenTree'];

export type GoalActivityHistory = RouterOutputs['goal']['getGoalActivityFeed'];
export type GoalComments = RouterOutputs['goal']['getGoalCommentsFeed'];

export type ExtractDBTypes = {
    [K in keyof DB]: ExtractTypeFromGenerated<DB[K]>;
};
