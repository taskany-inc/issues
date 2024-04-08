import { jsonBuildObject } from 'kysely/helpers/postgres';

import { db } from '../connection/kysely';
import { Role } from '../../generated/kysely/types';

interface GetProjectListParams {
    activityId: string;
    role: Role;
    limit?: number;
}

export const getProjectList = ({ activityId, role, limit = 5 }: GetProjectListParams) => {
    /* TODO: implements calculated fields like `./project.ts -> addCalculatedProjectFields` */
    const query = db
        .selectFrom('Project')
        .leftJoin('Activity as activity', 'activity.id', 'Project.activityId')
        .leftJoin('User as user', 'activity.id', 'user.activityId')
        .select(({ fn, ref }) => [
            'Project.id',
            'Project.title',
            'Project.averageScore',
            'Project.updatedAt',
            'Project.activityId',
            jsonBuildObject({
                id: ref('activity.id'),
                user: fn.toJson('user'),
            }).as('owner'),
        ])
        .where(({ eb, selectFrom }) =>
            eb
                .or([
                    eb(
                        'Project.id',
                        'in',
                        selectFrom('_projectWatchers')
                            .select('B')
                            .where('A', '=', activityId)
                            .union(
                                selectFrom('_projectStargizers')
                                    .select('B') // projectId
                                    .where('A', '=', activityId),
                            )
                            .union(
                                selectFrom('_projectParticipants')
                                    .select('B') // projectId
                                    .where('A', '=', activityId),
                            ),
                    ),
                    eb(
                        'Project.id',
                        'in',
                        selectFrom('Goal')
                            .select('Goal.projectId')
                            .distinct() // pick only unique values
                            .where((qb) =>
                                qb.and([
                                    qb('Goal.archived', 'is not', true),
                                    qb(
                                        'Goal.id',
                                        'in',
                                        selectFrom('_goalWatchers')
                                            .select('B') // goalId
                                            .where('A', '=', activityId)
                                            .union(
                                                selectFrom('_goalStargizers')
                                                    .select('B') // goalId
                                                    .where('A', '=', activityId),
                                            )
                                            .union(
                                                selectFrom('_goalParticipants')
                                                    .select('B') // goalId
                                                    .where('A', '=', activityId),
                                            ),
                                    ),
                                ]),
                            )
                            .$if(role === 'USER', (qb) => qb.where('Goal.ownerId', '=', activityId)),
                    ),
                ])
                .and('Project.archived', 'is not', true),
        )
        .$if(role === 'USER', (qb) =>
            /* check private access to project */
            qb.where(({ eb, not, exists, selectFrom }) =>
                eb.or([
                    eb('Project.activityId', '=', activityId),
                    eb('Project.id', 'in', selectFrom('_projectAccess').select('B').where('A', '=', activityId)),
                    not(exists(selectFrom('_projectAccess').select('B').where('_projectAccess.A', '=', activityId))),
                ]),
            ),
        )
        .orderBy('Project.updatedAt desc')
        .limit(limit);

    return query;
};
