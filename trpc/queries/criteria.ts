import { sql } from 'kysely';

import { db } from '../../src/utils/db/connection/kysely';
import { Activity, ExternalTask, Ghost, Goal, State, User } from '../../src/utils/db/generated/kysely/types';
import { ExtractTypeFromGenerated } from '../utils';

import { getUserActivity } from './activity';

interface CriteriaParams {
    id?: string;
    goalId?: string;
}

interface Criteria {
    id: string;
    title: string;
    weight: number;
    isDone: boolean;
    activityId: string;
    criteriaGoal:
        | (ExtractTypeFromGenerated<Goal> & {
              state: ExtractTypeFromGenerated<State> | null;
              owner: ExtractTypeFromGenerated<Activity> & {
                  user: ExtractTypeFromGenerated<User>;
                  ghost: ExtractTypeFromGenerated<Ghost>;
              };
              _shortId: string;
          })
        | null;
    externalTask: ExtractTypeFromGenerated<ExternalTask> | null;
}

export const criteriaQuery = (params: CriteriaParams = {}) => {
    return (
        db
            .selectFrom('GoalAchieveCriteria as criteria')
            .innerJoin('Goal as linkedGoal', 'criteria.goalId', 'linkedGoal.id')
            .leftJoinLateral(
                ({ selectFrom }) =>
                    selectFrom('Goal')
                        .innerJoin(
                            () => getUserActivity().as('activity'),
                            (join) => join.onRef('activity.id', '=', 'Goal.activityId'),
                        )
                        .innerJoin('State as state', 'state.id', 'Goal.stateId')
                        .selectAll('Goal')
                        .select(({ ref }) => [
                            sql`"activity"`.as('owner'),
                            sql`"state"`.as('state'),
                            sql<string>`concat(${ref('Goal.projectId')}, '-', ${ref('Goal.scopeId')})`.as('_shortId'),
                        ])
                        .whereRef('Goal.id', '=', 'criteria.criteriaGoalId')
                        .as('criteriaGoal'),
                (join) => join.onTrue(),
            )
            .leftJoin('ExternalTask as task', 'task.id', 'criteria.externalTaskId')
            .selectAll('criteria')
            .select(({ fn }) => [fn.toJson('criteriaGoal').as('criteriaGoal'), fn.toJson('task').as('externalTask')])
            .where('criteria.deleted', 'is not', true)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .$if(params.id != null, (qb) => qb.where('criteria.id', '=', params!.id as string))
            .$if(params.goalId != null, (qb) =>
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                qb.where('criteria.goalId', '=', params!.goalId as string),
            )
            .orderBy(['criteria.isDone desc', 'criteria.updatedAt desc'])
            .$castTo<Criteria>()
    );
};
