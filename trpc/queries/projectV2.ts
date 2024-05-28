import { sql } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/postgres';

import { db } from '../connection/kysely';
import { Role } from '../../generated/kysely/types';
import { QueryWithFilters } from '../../src/schema/common';

interface GetProjectListParams {
    activityId: string;
    role: Role;
    filter?: string[];
    limit?: number;
    offset?: number;
    goalsQuery?: QueryWithFilters;
}

export const getProjectList = ({
    activityId,
    role,
    limit = 5,
    offset = 0,
    goalsQuery,
    filter = [],
}: GetProjectListParams) => {
    const query = db
        .selectFrom('Project')
        .leftJoin('User as user', 'Project.activityId', 'user.activityId')
        .selectAll('Project')
        .select(({ fn, exists, val, selectFrom, ref }) => [
            exists(
                selectFrom('_projectWatchers').select('B').where('A', '=', activityId).whereRef('B', '=', 'Project.id'),
            ).as('_isWatching'),
            exists(
                selectFrom('_projectStargizers')
                    .select('B')
                    .where('A', '=', activityId)
                    .whereRef('B', '=', 'Project.id'),
            ).as('_isStarred'),
            sql<boolean>`("Project"."activityId" = ${val(activityId)})`.as('_isOwner'),
            sql<boolean>`((${val(role === Role.ADMIN)} or "Project"."activityId" = ${val(
                activityId,
            )}) and not "Project"."personal")`.as('_isEditable'),
            jsonBuildObject({
                activityId: ref('user.activityId'),
                user: fn.toJson('user'),
            }).as('activity'),
        ])
        .where(({ eb, selectFrom }) =>
            eb
                .or([
                    eb(
                        'Project.id',
                        'in',
                        selectFrom('_projectWatchers').select('B').where('A', '=', activityId).union(
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
                            .distinctOn('Goal.projectId') // pick only unique values
                            .where(
                                'Goal.id',
                                'in',
                                selectFrom('_goalWatchers')
                                    .select('B') // goalId
                                    .where('A', '=', activityId)
                                    .union(
                                        selectFrom('_goalParticipants')
                                            .select('B') // goalId
                                            .where('A', '=', activityId),
                                    ),
                            )
                            .where('Goal.archived', 'is', false)
                            .$if(goalsQuery?.project != null && goalsQuery.project.length > 0, (qb) =>
                                qb.where('Goal.projectId', 'in', goalsQuery?.project || []),
                            )
                            .$if(goalsQuery?.owner != null && goalsQuery.owner.length > 0, (qb) =>
                                qb.where('Goal.ownerId', 'in', goalsQuery?.owner || []),
                            )
                            .$if(goalsQuery?.issuer != null && goalsQuery.issuer.length > 0, (qb) =>
                                qb.where('Goal.activityId', 'in', goalsQuery?.issuer || []),
                            )
                            .$if(goalsQuery?.priority != null && goalsQuery.priority.length > 0, (qb) =>
                                qb.where('Goal.priorityId', 'in', goalsQuery?.priority || []),
                            )
                            .$if(goalsQuery?.state != null && goalsQuery.state.length > 0, (qb) =>
                                qb.where('Goal.stateId', 'in', goalsQuery?.state || []),
                            )
                            .$if(goalsQuery?.stateType != null && goalsQuery.stateType.length > 0, (qb) =>
                                qb.where('Goal.stateId', 'in', ({ selectFrom }) =>
                                    selectFrom('State')
                                        .select('State.id')
                                        .where('State.type', 'in', goalsQuery?.stateType || []),
                                ),
                            )
                            .$if(goalsQuery?.tag != null && goalsQuery.tag.length > 0, (qb) =>
                                qb.where('Goal.id', 'in', ({ selectFrom }) =>
                                    selectFrom('_GoalToTag')
                                        .select('A')
                                        .where('B', 'in', goalsQuery?.tag || []),
                                ),
                            )
                            .$if(goalsQuery?.participant != null && goalsQuery.participant.length > 0, (qb) =>
                                qb.where('Goal.id', 'in', ({ selectFrom }) =>
                                    selectFrom('_goalParticipants')
                                        .select('A')
                                        .where('B', 'in', goalsQuery?.participant || []),
                                ),
                            )
                            .$if(goalsQuery?.query != null && goalsQuery.query.length > 0, (qb) =>
                                qb.where(({ or, eb }) =>
                                    or([
                                        eb('Goal.title', 'ilike', goalsQuery?.query || ''),
                                        eb('Goal.description', 'ilike', goalsQuery?.query || ''),
                                        eb('Goal.projectId', 'in', (qb) =>
                                            qb
                                                .selectFrom('Project')
                                                .select('Project.id')
                                                .where((eb) =>
                                                    eb.or([
                                                        eb('Project.title', 'ilike', goalsQuery?.query || ''),
                                                        eb('Project.description', 'ilike', goalsQuery?.query || ''),
                                                    ]),
                                                ),
                                        ),
                                    ]),
                                ),
                            )
                            .$if(role === Role.USER, (qb) => qb.where('Goal.ownerId', '=', activityId)),
                    ),
                ])
                .and('Project.archived', 'is not', true),
        )
        .$if(role === Role.USER, (qb) =>
            /* check private access to project */
            qb.where(({ eb, not, exists, selectFrom }) =>
                eb.or([
                    eb('Project.activityId', '=', activityId),
                    eb('Project.id', 'in', selectFrom('_projectAccess').select('B').where('A', '=', activityId)),
                    not(exists(selectFrom('_projectAccess').select('B').where('_projectAccess.A', '=', activityId))),
                ]),
            ),
        )
        .$if(filter.length > 0, (qb) => qb.where('Project.id', 'not in', filter))
        .orderBy('Project.updatedAt desc')
        .offset(offset)
        .limit(limit);

    return query;
};

export const getProjectsByIds = (params: { in: Array<{ id: string }>; activityId: string; role: Role }) => {
    return db
        .selectFrom('Project')
        .leftJoin('User as user', 'Project.activityId', 'user.activityId')
        .leftJoinLateral(
            ({ selectFrom }) => {
                return selectFrom('User')
                    .selectAll('User')
                    .distinctOn('User.id')
                    .where('User.activityId', 'in', (qb) =>
                        qb.selectFrom('_projectParticipants').select('A').whereRef('B', '=', 'Project.id'),
                    )
                    .as('participant');
            },
            (join) => join.onTrue(),
        )
        .selectAll('Project')
        .select(({ fn, exists, val, selectFrom, ref }) => [
            exists(
                selectFrom('_projectWatchers')
                    .select('B')
                    .where('A', '=', params.activityId)
                    .whereRef('B', '=', 'Project.id'),
            ).as('_isWatching'),
            exists(
                selectFrom('_projectStargizers')
                    .select('B')
                    .where('A', '=', params.activityId)
                    .whereRef('B', '=', 'Project.id'),
            ).as('_isStarred'),
            sql<boolean>`("Project"."activityId" = ${val(params.activityId)})`.as('_isOwner'),
            sql<boolean>`((${val(params.role === Role.ADMIN)} or "Project"."activityId" = ${val(
                params.activityId,
            )}) and not "Project"."personal")`.as('_isEditable'),
            jsonBuildObject({
                activityId: ref('user.activityId'),
                user: fn.toJson('user'),
            }).as('activity'),
            jsonBuildObject({
                stargizers: sql<number>`(select count("A") from "_projectStargizers" where "B" = "Project".id)`,
                watchers: sql<number>`(select count("A") from "_projectWatchers" where "B" = "Project".id)`,
                children: sql<number>`(select count("B") from "_parentChildren" where "A" = "Project".id)`,
                participants: sql<number>`(select count("A") from "_projectParticipants"  where "B" = "Project".id)`,
            }).as('_count'),
        ])
        .select([
            sql`(select count("B")::int from "_parentChildren" where "A" = "Project".id)`.as('children'),
            sql`
                case
                    when count(participant) > 0
                    then array_agg(json_build_object(
                        'activityId', participant."activityId",
                        'user', to_jsonb(participant)
                    ))
                    else null
                end
                `.as('participants'),
        ])
        .groupBy(['Project.id', 'user.id'])
        .where(
            'Project.id',
            'in',
            params.in.map(({ id }) => id),
        );
};

export const getParentProjectsId = (params: { in: Array<{ id: string }> }) => {
    return db
        .selectFrom('_parentChildren')
        .distinctOn('_parentChildren.A')
        .select('_parentChildren.A as id')
        .where(
            '_parentChildren.B',
            'in',
            params.in.map(({ id }) => id),
        );
};

export const getChildrenProjectsId = (params: { in: Array<{ id: string }> }) => {
    return db
        .selectFrom('_parentChildren')
        .distinctOn('_parentChildren.B')
        .select('_parentChildren.B as id')
        .where(
            '_parentChildren.A',
            'in',
            params.in.map(({ id }) => id),
        );
};
