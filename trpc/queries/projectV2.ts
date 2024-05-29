import { AnyColumnWithTable, Expression, OrderByExpression, sql } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/postgres';
import { OrderByDirection, DirectedOrderByStringReference } from 'kysely/dist/cjs/parser/order-by-parser';

import { db } from '../connection/kysely';
import { DB, Role } from '../../generated/kysely/types';
import { QueryWithFilters } from '../../src/schema/common';
import { decodeUrlDateRange, getDateString } from '../../src/utils/dateTime';

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
                        selectFrom('_projectWatchers')
                            .select('B') // projectId
                            .where('A', '=', activityId)
                            .union(
                                selectFrom('_projectParticipants')
                                    .select('B') // projectId
                                    .where('A', '=', activityId),
                            )
                            .union(
                                selectFrom('_projectStargizers')
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
                goals: sql<number>`(select count("Goal".id) from "Goal" where "Goal"."projectId" = "Project".id and "Goal".archived is not true)`,
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
        .$if(params.in.length > 0, (qb) =>
            qb.where((eb) =>
                eb.or([
                    eb(
                        'Project.id',
                        'in',
                        params.in.map(({ id }) => id),
                    ),
                ]),
            ),
        );
};

export const getParentProjectsId = (params: { in: Array<{ id: string }> }) => {
    return db
        .selectFrom('_parentChildren')
        .distinctOn('_parentChildren.A')
        .select('_parentChildren.A as id')
        .$if(params.in.length > 0, (qb) =>
            qb.where(
                '_parentChildren.B',
                'in',
                params.in.map(({ id }) => id),
            ),
        );
};

export const getChildrenProjectsId = (params: { in: Array<{ id: string }> }) => {
    return db
        .selectFrom('_parentChildren')
        .distinctOn('_parentChildren.B')
        .select('_parentChildren.B as id')
        .$if(params.in.length > 0, (qb) =>
            qb.where(
                '_parentChildren.A',
                'in',
                params.in.map(({ id }) => id),
            ),
        );
};

interface GetUserProjectsQueryParams {
    activityId: string;
    role: Role;
    filter?: string[];
    limit?: number;
    includeSubsGoals?: boolean;
}

export const getUserProjectsQuery = ({
    activityId,
    role,
    filter = [],
    limit = 5,
    includeSubsGoals,
}: GetUserProjectsQueryParams) => {
    return db
        .selectFrom('Project')
        .selectAll('Project')
        .where('Project.archived', 'is not', true)
        .where(({ and, or, eb }) =>
            and([
                eb('Project.archived', 'is not', true),
                or(
                    [
                        eb('Project.activityId', '=', activityId),
                        eb('Project.id', 'in', ({ selectFrom }) =>
                            selectFrom('_projectParticipants')
                                .select('B')
                                .where('A', '=', activityId)
                                .union(selectFrom('_projectWatchers').select('B').where('A', '=', activityId))
                                .union(selectFrom('_projectStargizers').select('B').where('A', '=', activityId)),
                        ),
                    ].concat(
                        includeSubsGoals
                            ? [
                                  eb('Project.id', 'in', ({ selectFrom }) =>
                                      selectFrom('Goal')
                                          .select('Goal.projectId')
                                          .where(({ or, eb, and }) =>
                                              and([
                                                  eb('Goal.archived', 'is not', true),
                                                  or([
                                                      eb('Goal.id', 'in', ({ selectFrom }) =>
                                                          selectFrom('_goalParticipants')
                                                              .select('B')
                                                              .where('A', '=', activityId)
                                                              .union(
                                                                  selectFrom('_goalWatchers')
                                                                      .select('B')
                                                                      .where('A', '=', activityId),
                                                              )
                                                              .union(
                                                                  selectFrom('_goalStargizers')
                                                                      .select('B')
                                                                      .where('A', '=', activityId),
                                                              ),
                                                      ),
                                                      eb('Goal.ownerId', '=', activityId),
                                                  ]),
                                              ]),
                                          ),
                                  ),
                              ]
                            : [],
                    ),
                ),
            ]),
        )
        .$if(filter.length > 0, (qb) => qb.where('Project.id', 'not in', filter))
        .$if(role === Role.USER, (qb) =>
            qb.where(({ or, eb, not, exists }) =>
                or([
                    eb('Project.id', 'in', ({ selectFrom }) =>
                        selectFrom('_projectAccess').select('B').where('A', '=', activityId),
                    ),
                    not(
                        exists(({ selectFrom }) =>
                            selectFrom('_projectAccess').select('B').whereRef('B', '=', 'Project.id'),
                        ),
                    ),
                ]),
            ),
        )
        .limit(limit)
        .orderBy('Project.updatedAt desc');
};

const mapSortParamsToTableColumns = (sort: QueryWithFilters['sort']): Array<OrderByExpression<DB, 'Goal', unknown>> => {
    if (!sort) {
        return ['Goal.updatedAt desc'];
    }

    const mapToTableColumn: Record<
        keyof NonNullable<QueryWithFilters['sort']>,
        AnyColumnWithTable<DB, 'Goal'> | Record<OrderByDirection, Expression<string>>
    > = {
        title: 'Goal.title',
        state: {
            asc: sql`state.title asc`,
            desc: sql`state.title desc`,
        },
        priority: {
            asc: sql`priority.value asc`,
            desc: sql`priority.value desc`,
        },
        project: {
            asc: sql`project.title asc`,
            desc: sql`project.title desc`,
        },
        activity: {
            asc: sql`activity.name asc`,
            desc: sql`activity.name desc`,
        },
        owner: {
            asc: sql`owner.name asc`,
            desc: sql`owner.name desc`,
        },
        updatedAt: 'Goal.updatedAt',
        createdAt: 'Goal.createdAt',
    };

    return (
        Object.entries(sort) as Array<[keyof NonNullable<QueryWithFilters['sort']>, NonNullable<OrderByDirection>]>
    ).map<OrderByExpression<DB, 'Goal', unknown>>(([key, dir]) => {
        const rule = mapToTableColumn[key];

        if (typeof rule === 'string') {
            return `${rule} ${dir}` as DirectedOrderByStringReference<DB, 'Goal', unknown>;
        }

        return rule[dir];
    });
};

interface GetProjectsWithGoalsByIdsParams extends GetUserProjectsQueryParams {
    in: Array<{ id: string }>;
    goalsQuery?: QueryWithFilters;
    limit?: number;
    offset?: number;
}

export const getUserProjectsWithGoals = (params: GetProjectsWithGoalsByIdsParams) => {
    const { goalsQuery, in: inList, limit = 5, offset = 0, ...user } = params;

    return db
        .selectFrom('Project')
        .leftJoinLateral(
            ({ selectFrom }) =>
                /**
                 * TODO:
                 * find the decision for pass closure `selectFrom` func
                 * as queryBuilder inside any query function
                 */
                selectFrom('Goal')
                    .innerJoin('User as owner', 'owner.activityId', 'Goal.ownerId')
                    .innerJoin('User as activity', 'activity.activityId', 'Goal.activityId')
                    .innerJoin('State as state', 'state.id', 'Goal.stateId')
                    .innerJoin('Priority as priority', 'priority.id', 'Goal.priorityId')
                    .leftJoinLateral(
                        ({ selectFrom: selectFrom2 }) =>
                            selectFrom2('Tag')
                                .selectAll('Tag')
                                .distinctOn('Tag.id')
                                .where('Tag.id', 'in', (qb) =>
                                    qb.selectFrom('_GoalToTag').select('B').whereRef('A', '=', 'Goal.id'),
                                )
                                .as('tag'),
                        (join) => join.onTrue(),
                    )
                    .leftJoinLateral(
                        ({ selectFrom: selectFrom2 }) =>
                            selectFrom2('User')
                                .selectAll('User')
                                .distinctOn('User.activityId')
                                .whereRef('User.activityId', 'in', (qb) =>
                                    qb.selectFrom('_goalParticipants').select('A').whereRef('B', '=', 'Goal.id'),
                                )
                                .groupBy('User.id')
                                .as('participant'),
                        (join) => join.onTrue(),
                    )
                    .leftJoinLateral(
                        ({ selectFrom }) =>
                            selectFrom('GoalAchieveCriteria')
                                .leftJoin(
                                    'Goal as criteriaGoal',
                                    'GoalAchieveCriteria.criteriaGoalId',
                                    'criteriaGoal.id',
                                )
                                .selectAll('GoalAchieveCriteria')
                                .select(({ eb, fn }) => [
                                    eb
                                        .case()
                                        .when('criteriaGoal.id', 'is not', null)
                                        .then(fn.toJson('criteriaGoal'))
                                        .else(null)
                                        .end()
                                        .as('criteriaGoal'),
                                ])
                                .whereRef('GoalAchieveCriteria.goalId', '=', 'Goal.id')
                                .as('criteria'),
                        (join) => join.onTrue(),
                    )
                    .selectAll('Goal')
                    .select(({ fn, eb, ref }) => [
                        sql<string>`concat("Goal"."projectId", '-', "Goal"."scopeId")::text`.as('_shortId'),
                        jsonBuildObject({
                            comments: sql<number>`(select count("Comment".id) from "Comment" where "Comment"."goalId" = "Goal".id)`,
                        }).as('_count'),
                        eb
                            .case()
                            .when(fn.count('participant.id'), '>', 0)
                            .then(
                                fn.agg('array_agg', [
                                    jsonBuildObject({
                                        activityId: ref('participant.activityId'),
                                        user: fn.toJson('participant'),
                                    }),
                                ]),
                            )
                            .else(null)
                            .end()
                            .as('participants'),
                        eb
                            .case()
                            .when(fn.count('tag.id'), '>', 0)
                            .then(fn.agg('array_agg', [fn.toJson('tag')]))
                            .else(null)
                            .end()
                            .as('tags'),
                        eb
                            .case()
                            .when(fn.count('criteria.id'), '>', 0)
                            .then(fn.agg('array_agg', [fn.toJson('criteria')]))
                            .else(null)
                            .end()
                            .as('criteria'),
                        jsonBuildObject({
                            activityId: ref('owner.activityId'),
                            user: fn.toJson('owner'),
                        }).as('owner'),
                        jsonBuildObject({
                            activityId: ref('activity.activityId'),
                            user: fn.toJson('activity'),
                        }).as('activity'),
                        fn.toJson('state').as('state'),
                        fn.toJson('priority').as('priority'),
                    ])
                    .where(({ or, and, eb, ref, val, selectFrom }) => {
                        const estimate: Array<Date> = [];

                        if (goalsQuery?.estimate != null) {
                            const parsedEstimateFilter = decodeUrlDateRange(goalsQuery.estimate[0]);

                            if (parsedEstimateFilter) {
                                const end = new Date(getDateString(parsedEstimateFilter.end));
                                const start = parsedEstimateFilter.start
                                    ? new Date(getDateString(parsedEstimateFilter.start))
                                    : null;

                                if (start != null) {
                                    estimate.push(start, end);
                                } else {
                                    estimate.push(end);
                                }
                            }
                        }

                        const filters: Record<keyof NonNullable<typeof goalsQuery>, null | ReturnType<typeof eb>> = {
                            project: eb('Goal.projectId', 'in', goalsQuery?.project || []),
                            owner: eb('Goal.ownerId', 'in', goalsQuery?.owner || []),
                            issuer: eb('Goal.activityId', 'in', goalsQuery?.issuer || []),
                            participant: eb('participant.activityId', 'in', goalsQuery?.participant || []),
                            priority: eb('Goal.priorityId', 'in', goalsQuery?.priority || []),
                            state: eb('Goal.stateId', 'in', goalsQuery?.state || []),
                            stateType: eb('Goal.stateId', 'in', ({ selectFrom }) =>
                                selectFrom('State')
                                    .select('State.id')
                                    .where('State.type', 'in', goalsQuery?.stateType || []),
                            ),
                            tag: eb('tag.id', 'in', goalsQuery?.tag || []),
                            estimate:
                                // eslint-disable-next-line no-nested-ternary
                                estimate.length > 0
                                    ? estimate.length === 1
                                        ? eb('Goal.estimate', 'in', val<Date>(estimate[0]))
                                        : and([
                                              eb('Goal.estimate', '>=', val<Date>(estimate[0])),
                                              eb('Goal.estimate', '<=', val<Date>(estimate[1])),
                                          ])
                                    : null,
                            query: or([
                                eb('Goal.title', 'ilike', goalsQuery?.query || ''),
                                eb('Goal.description', 'ilike', goalsQuery?.query || ''),
                                eb('Goal.projectId', 'in', () =>
                                    selectFrom('Project')
                                        .select('Project.id')
                                        .where((eb) =>
                                            eb.or([
                                                eb('Project.title', 'ilike', goalsQuery?.query || ''),
                                                eb('Project.description', 'ilike', goalsQuery?.query || ''),
                                            ]),
                                        ),
                                ),
                            ]),
                            sort: null,
                            starred: null,
                            watching: null,
                        };

                        const filterToApply: Array<ReturnType<typeof eb>> = [];

                        if (goalsQuery != null) {
                            (Object.keys(goalsQuery) as Array<keyof typeof goalsQuery>).forEach((key) => {
                                const expr = filters[key];
                                if (goalsQuery[key] != null && expr != null) {
                                    filterToApply.push(expr);
                                }
                            });
                        }

                        return and([
                            eb('Goal.archived', 'is not', true),
                            or([
                                and([
                                    or([
                                        eb('Goal.ownerId', '=', user.activityId),
                                        eb('Goal.activityId', '=', user.activityId),
                                        eb(
                                            'Goal.id',
                                            'in',
                                            selectFrom('Goal')
                                                .select('id')
                                                .where(
                                                    'id',
                                                    'in',
                                                    selectFrom('_goalParticipants')
                                                        .select('B')
                                                        .where('A', '=', user.activityId)
                                                        .union(
                                                            selectFrom('_goalWatchers')
                                                                .select('B')
                                                                .where('A', '=', user.activityId),
                                                        )
                                                        .union(
                                                            selectFrom('_goalStargizers')
                                                                .select('B')
                                                                .where('A', '=', user.activityId),
                                                        ),
                                                )
                                                .where('archived', 'is not', true),
                                        ),
                                    ]),
                                    and(filterToApply),
                                ]),
                                and([eb('Goal.projectId', '=', ref('Project.id')), and(filterToApply)]),
                            ]),
                        ]);
                    })
                    .$if(user.role === Role.USER, (qb) =>
                        qb.where('Goal.projectId', 'in', ({ selectFrom }) =>
                            selectFrom('Project')
                                .select('Project.id')
                                .where(({ eb, not, exists, selectFrom }) =>
                                    eb.or([
                                        eb('Project.activityId', '=', user.activityId),
                                        eb(
                                            'Project.id',
                                            'in',
                                            selectFrom('_projectAccess').select('B').where('A', '=', user.activityId),
                                        ),
                                        not(
                                            exists(
                                                selectFrom('_projectAccess')
                                                    .select('B')
                                                    .where('_projectAccess.A', '=', user.activityId),
                                            ),
                                        ),
                                    ]),
                                ),
                        ),
                    )
                    .orderBy(mapSortParamsToTableColumns(goalsQuery?.sort))
                    .groupBy(['Goal.id', 'owner.id', 'state.id', 'priority.id', 'activity.id'])
                    .as('goal'),
            (join) => join.onTrue(),
        )
        .select(({ fn, eb }) => [
            'Project.id',
            eb
                .case()
                .when(fn.count('goal.id'), '>', 0)
                .then(fn.agg('array_agg', [fn.toJson('goal')]))
                .else(null)
                .end()
                .as('goals'),
        ])
        .$if(inList.length > 0, (qb) =>
            qb.where(
                'Project.id',
                'in',
                inList.map(({ id }) => id),
            ),
        )
        .groupBy(['Project.id'])
        .orderBy('Project.updatedAt desc')
        .$if(goalsQuery != null, (qb) => qb.having(({ fn }) => fn.count('goal.id'), '>', 0))
        .limit(limit)
        .offset(offset);
};

interface GetWholeGoalCountByProjectIds {
    in: Array<{ id: string }>;
}

export const getWholeGoalCountByProjectIds = (params: GetWholeGoalCountByProjectIds) => {
    return db
        .selectFrom('Project')
        .select([
            sql<number>`sum((select count("Goal".id) from "Goal" where "Goal".archived is not true and "Goal"."projectId" = "Project".id))`.as(
                'wholeGoalsCount',
            ),
        ])
        .$if(params.in.length > 0, (qb) =>
            qb.where(
                'Project.id',
                'in',
                params.in.map(({ id }) => id),
            ),
        );
};
