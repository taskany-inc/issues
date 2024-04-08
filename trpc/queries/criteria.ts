import { jsonBuildObject } from 'kysely/helpers/postgres';
import { sql } from 'kysely';

import { db } from '../connection/kysely';
import { Activity, Ghost, Role, State, User } from '../../generated/kysely/types';

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
    criteriaGoal: {
        id: string;
        title: string;
        projectId: string;
        _shortId: string;
        state:
            | (Omit<State, 'createdAt' | 'updatedAt' | 'hue'> & { createdAt: Date; updatedAt: Date; hue: number })
            | null;
        owner: Pick<Activity, 'id'> & {
            user: Omit<User, 'createdAt' | 'updatedAt' | 'active' | 'emailVerified' | 'role' | 'invitedAt'> & {
                createdAt: Date;
                updatedAt: Date;
                invitedAt: Date | null;
                active: boolean;
                emailVerified: Date | null;
                role: Role;
            };
            ghost: Omit<Ghost, 'createdAt' | 'updatedAt'> & { createdAt: Date; updatedAt: Date };
            createdAt: Date;
            updatedAt: Date;
            ghostId: string;
            settingsId: string;
        };
    } | null;
}

export const criteriaQuery = (params: CriteriaParams = {}) => {
    return (
        db
            .selectFrom('GoalAchieveCriteria as criteria')
            .innerJoin('Goal as linkedGoal', 'criteria.goalId', 'linkedGoal.id')
            .leftJoin('Goal as criteriaGoal', 'criteriaGoal.id', 'criteria.criteriaGoalId')
            .leftJoin('State as state', 'state.id', 'criteriaGoal.stateId')
            .leftJoin('Activity as activity', 'criteriaGoal.activityId', 'activity.id')
            .leftJoin('User as user', 'activity.id', 'user.activityId')
            .leftJoin('Ghost as ghost', 'activity.ghostId', 'ghost.id')
            .selectAll('criteria')
            .select(({ ref, fn, eb }) => [
                'criteria.id',
                'criteria.title',
                'criteria.activityId',
                'criteria.isDone',
                'criteria.weight',
                eb
                    .case()
                    .when('criteria.criteriaGoalId', '=', ref('criteriaGoal.id'))
                    .then(
                        jsonBuildObject({
                            id: sql<string>`"criteriaGoal".id`,
                            title: sql<string>`"criteriaGoal".title`,
                            projectId: sql<string>`"criteriaGoal"."projectId"`,
                            _shortId: sql<string>`concat(${ref('criteriaGoal.projectId')}, '-', ${ref(
                                'criteriaGoal.scopeId',
                            )})`,
                            state: fn.toJson('state'),
                            owner: jsonBuildObject({
                                id: sql<string>`activity.id`,
                                createdAt: ref('activity.createdAt'),
                                updatedAt: ref('activity.updatedAt'),
                                ghostId: ref('activity.ghostId'),
                                settingsId: ref('activity.settingsId'),
                                user: fn.toJson('user'),
                                ghost: fn.toJson('ghost'),
                            }),
                        }),
                    )
                    .else(null)
                    .end()
                    .as('criteriaGoal'),
            ])
            .where('criteria.deleted', 'is not', true)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .$if(params.id != null, (qb) => qb.where('criteria.id', '=', params!.id as string))
            .$if(params.goalId != null, (qb) =>
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                qb.where('criteria.goalId', '=', params!.goalId as string),
            )
            .orderBy('criteria.updatedAt desc')
            .orderBy('criteria.isDone asc')
            .$castTo<Criteria>()
    );
};
