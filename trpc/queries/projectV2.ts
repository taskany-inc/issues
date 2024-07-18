import { AnyColumnWithTable, Expression, OrderByExpression, sql } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/postgres';
import { OrderByDirection, DirectedOrderByStringReference } from 'kysely/dist/cjs/parser/order-by-parser';

import { db } from '../connection/kysely';
import { DB, Role } from '../../generated/kysely/types';
import { QueryWithFilters } from '../../src/schema/common';
import { decodeUrlDateRange, getDateString } from '../../src/utils/dateTime';

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

export const getStarredProjectsIds = (activityId: string) => {
    return db
        .selectFrom('Project')
        .select(['Project.id'])
        .where('Project.id', 'in', ({ selectFrom }) =>
            selectFrom('_projectStargizers').select('B').where('A', '=', activityId),
        )
        .where('Project.archived', 'is not', true);
};

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
                                                      eb('Goal.activityId', '=', activityId),
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
    in?: Array<{ id: string }>;
    goalsQuery?: QueryWithFilters;
    limit?: number;
    offset?: number;
}

/** Limit for subquery goals by project */
const dashboardGoalByProjectLimit = 30;

export const getUserProjectsWithGoals = (params: GetProjectsWithGoalsByIdsParams) => {
    return db
        .with('subs_projects', (db) =>
            db
                .selectFrom('_projectParticipants')
                .select('B')
                .where('A', '=', params.activityId)
                .union(db.selectFrom('_projectWatchers').select('B').where('A', '=', params.activityId))
                .union(db.selectFrom('_projectStargizers').select('B').where('A', '=', params.activityId)),
        )
        .with('subs_goals', (db) =>
            db
                .selectFrom('_goalParticipants')
                .select('B')
                .where('A', '=', params.activityId)
                .union(db.selectFrom('_goalWatchers').select('B').where('A', '=', params.activityId))
                .union(db.selectFrom('_goalStargizers').select('B').where('A', '=', params.activityId)),
        )
        .with('project_ids', (db) =>
            db
                .selectFrom('Project')
                .select('Project.id as pid')
                .where(({ or, eb }) =>
                    or([
                        eb('Project.id', 'in', ({ selectFrom }) => selectFrom('subs_projects').select('B')),
                        eb('Project.activityId', '=', params.activityId),
                    ]),
                )
                .union(
                    db
                        .selectFrom('_parentChildren')
                        .select('B as pid')
                        .where('A', 'in', ({ selectFrom }) => selectFrom('subs_projects').select('B')),
                ),
        )
        .with('goals', (db) =>
            db
                .selectFrom('Goal')
                .selectAll('Goal')
                .leftJoinLateral(
                    ({ selectFrom }) =>
                        selectFrom('Activity')
                            .distinctOn('Activity.id')
                            .innerJoin('User', 'User.activityId', 'Activity.id')
                            .leftJoin('Ghost', 'Ghost.id', 'Activity.ghostId')
                            .selectAll('Activity')
                            .select([sql`"User"`.as('user'), sql`"Ghost"`.as('ghost')])
                            .whereRef('Activity.id', 'in', (qb) =>
                                qb.selectFrom('_goalParticipants').select('A').whereRef('B', '=', 'Goal.id'),
                            )
                            .as('participant'),
                    (join) => join.onTrue(),
                )
                .leftJoinLateral(
                    ({ selectFrom }) =>
                        selectFrom('_GoalToTag')
                            .innerJoin('Tag', 'Tag.id', 'B')
                            .selectAll('Tag')
                            .whereRef('A', '=', 'Goal.id')
                            .as('tag'),
                    (join) => join.onTrue(),
                )
                .leftJoinLateral(
                    ({ selectFrom }) =>
                        selectFrom('GoalAchieveCriteria')
                            .leftJoin('Goal as criteriaGoal', 'GoalAchieveCriteria.criteriaGoalId', 'Goal.id')
                            .selectAll('GoalAchieveCriteria')
                            .select([sql`"criteriaGoal"`.as('criteriaGoal')])
                            .whereRef('GoalAchieveCriteria.goalId', '=', 'Goal.id')
                            .where('GoalAchieveCriteria.deleted', 'is not', true)
                            .as('criteria'),
                    (join) => join.onTrue(),
                )
                .select((eb) => [
                    sql<string>`concat("Goal"."projectId", '-', "Goal"."scopeId")::text`.as('_shortId'),
                    jsonBuildObject({
                        comments: eb
                            .selectFrom('Comment')
                            .select(({ fn }) => [fn.count('Comment.id').as('count')])
                            .whereRef('Comment.goalId', '=', 'Goal.id'),
                    }).as('_count'),
                    eb
                        .case()
                        .when(eb.fn.count('criteria.id'), '>', 0)
                        .then(eb.fn.agg('array_agg', [sql`"criteria"`]).distinct())
                        .else(null)
                        .end()
                        .as('criteria'),
                    eb
                        .case()
                        .when(eb.fn.count('tag.id'), '>', 0)
                        .then(eb.fn.agg('array_agg', [sql`"tag"`]).distinct())
                        .else(null)
                        .end()
                        .as('tags'),
                    eb
                        .case()
                        .when(eb.fn.count('participant.id'), '>', 0)
                        .then(eb.fn.agg('array_agg', [sql`"participant"`]).distinct())
                        .else(null)
                        .end()
                        .as('participants'),
                ])
                .where(({ or, eb }) =>
                    or([
                        eb('Goal.id', 'in', ({ selectFrom }) => selectFrom('subs_goals').select('B')),
                        eb('Goal.projectId', 'in', ({ selectFrom }) => selectFrom('project_ids').select('pid')),
                        eb('Goal.ownerId', '=', params.activityId),
                        eb('Goal.activityId', '=', params.activityId),
                    ]),
                )
                .where(({ or, and, eb, selectFrom, cast, val }) => {
                    const { goalsQuery } = params;
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
                        participant: eb('participant.id', 'in', goalsQuery?.participant || []),
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
                                    ? eb('Goal.estimate', '=', cast<Date>(val<Date>(estimate[0]), 'date'))
                                    : and([
                                          eb('Goal.estimate', '>=', cast<Date>(val<Date>(estimate[0]), 'date')),
                                          eb('Goal.estimate', '<=', cast<Date>(val<Date>(estimate[1]), 'date')),
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

                    return and(filterToApply);
                })
                .where('Goal.archived', 'is not', true)
                .groupBy('Goal.id')
                .orderBy(mapSortParamsToTableColumns(params.goalsQuery?.sort)),
        )
        .selectFrom('Project')
        .leftJoinLateral(
            ({ selectFrom }) =>
                selectFrom('goals')
                    .selectAll('goals')
                    .innerJoin(
                        ({ selectFrom }) =>
                            selectFrom('Activity')
                                .selectAll('Activity')
                                .innerJoin('User', 'User.activityId', 'Activity.id')
                                .leftJoin('Ghost', 'Ghost.id', 'Activity.ghostId')
                                .select([sql`"User"`.as('user'), sql`"Ghost"`.as('ghost')])
                                .as('owner'),
                        (join) => join.onRef('owner.id', '=', 'goals.ownerId'),
                    )
                    .innerJoin(
                        ({ selectFrom }) =>
                            selectFrom('Activity')
                                .selectAll('Activity')
                                .innerJoin('User', 'User.activityId', 'Activity.id')
                                .leftJoin('Ghost', 'Ghost.id', 'Activity.ghostId')
                                .select([sql`"User"`.as('user'), sql`"Ghost"`.as('ghost')])
                                .as('activityUser'),
                        (join) => join.onRef('activityUser.id', '=', 'goals.activityId'),
                    )
                    .innerJoin('User as activity', 'activity.activityId', 'goals.activityId')
                    .innerJoin('State as state', 'state.id', 'goals.stateId')
                    .innerJoin('Priority as priority', 'priority.id', 'goals.priorityId')
                    .select([
                        sql`"owner"`.as('owner'),
                        sql`"activityUser"`.as('activity'),
                        sql`"state"`.as('state'),
                        sql`"priority"`.as('priority'),
                    ])
                    .whereRef('goals.projectId', '=', 'Project.id')
                    .limit(dashboardGoalByProjectLimit)
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
            jsonBuildObject({
                stargizers: sql<number>`(select count("A") from "_projectStargizers" where "B" = "Project".id)`,
                watchers: sql<number>`(select count("A") from "_projectWatchers" where "B" = "Project".id)`,
                children: sql<number>`(select count("B") from "_parentChildren" where "A" = "Project".id)`,
                participants: sql<number>`(select count("A") from "_projectParticipants"  where "B" = "Project".id)`,
                goals: fn.count('goal.id'),
            }).as('_count'),
        ])
        .where('Project.archived', 'is not', true)
        .where(({ or, eb }) =>
            or([
                eb('Project.id', 'in', ({ selectFrom }) => selectFrom('goals').select('goals.projectId')),
                eb('Project.id', 'in', ({ selectFrom }) => selectFrom('project_ids').select('pid')),
            ]),
        )
        .groupBy('Project.id')
        .orderBy('Project.updatedAt desc')
        .$if(params.goalsQuery != null, (qb) => qb.having(({ fn }) => fn.count('goal.id'), '>', 0))
        .limit(params.limit || 5)
        .offset(params.offset || 0);
};

interface GetWholeGoalCountByProjectIds {
    in: Array<{ id: string }>;
}

export const getWholeGoalCountByProjectIds = (params: GetWholeGoalCountByProjectIds) => {
    return db
        .selectFrom('Project')
        .select((eb) => [
            eb
                .selectFrom('Goal')
                .select(({ fn }) => [fn.count('Goal.id').as('count')])
                .whereRef('Goal.projectId', '=', 'Project.id')
                .where('Goal.archived', 'is not', true)
                .as('wholeGoalsCount'),
        ])
        .$if(params.in.length > 0, (qb) =>
            qb.where(
                'Project.id',
                'in',
                params.in.map(({ id }) => id),
            ),
        );
};
