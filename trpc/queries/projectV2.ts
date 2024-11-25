import { AnyColumnWithTable, Expression, ExpressionOrFactory, Nullable, OrderByExpression, sql, SqlBool } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/postgres';
import { OrderByDirection } from 'kysely/dist/cjs/parser/order-by-parser';
import { decodeUrlDateRange, getDateString } from '@taskany/bricks';

import { db } from '../connection/kysely';
import { Activity, DB, Role } from '../../generated/kysely/types';
import { QueryWithFilters, SortableProjectsPropertiesArray } from '../../src/schema/common';

import { getUserActivity } from './activity';

export const getProjectsByIds = (params: { in: Array<{ id: string }>; activityId: string; role: Role }) => {
    return db
        .with('project_goals', () =>
            db
                .selectFrom('Goal')
                .select(['Goal.id', 'Goal.projectId'])
                .$if(params.in.length > 0, (qb) =>
                    qb.where((eb) =>
                        eb.or([
                            eb(
                                'Goal.projectId',
                                'in',
                                params.in.map(({ id }) => id),
                            ),
                        ]),
                    ),
                ),
        )
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
            exists(
                selectFrom('_goalWatchers')
                    .select('B')
                    .where('A', '=', params.activityId)
                    .whereRef('B', 'in', ({ selectFrom }) =>
                        selectFrom('project_goals').select('id').whereRef('projectId', '=', 'Project.id'),
                    ),
            ).as('_isGoalWatching'),
            exists(
                selectFrom('_goalStargizers')
                    .select('B')
                    .where('A', '=', params.activityId)
                    .whereRef('B', 'in', ({ selectFrom }) =>
                        selectFrom('project_goals').select('id').whereRef('projectId', '=', 'Project.id'),
                    ),
            ).as('_isGoalStarred'),
            jsonBuildObject({
                activityId: ref('user.activityId'),
                user: fn.toJson('user'),
            }).as('activity'),
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
        .select([
            jsonBuildObject({
                stargizers: sql<number>`(select count("A") from "_projectStargizers" where "B" = "Project".id)`,
                watchers: sql<number>`(select count("A") from "_projectWatchers" where "B" = "Project".id)`,
                children: sql<number>`(select count("B") from "_parentChildren" where "A" = "Project".id)`,
                participants: sql<number>`(select count("A") from "_projectParticipants"  where "B" = "Project".id)`,
            }).as('_count'),
        ])
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

export const getDeepChildrenProjectsId = (params: { in: Array<{ id: string }> }) => {
    return db
        .withRecursive('childrenTree', (qb) =>
            qb
                .selectFrom('_parentChildren')
                .select('_parentChildren.B as id')
                .$if(params.in.length > 0, (qb) =>
                    qb.where(
                        '_parentChildren.A',
                        'in',
                        params.in.map(({ id }) => id),
                    ),
                )
                .union((qb) =>
                    qb
                        .selectFrom('_parentChildren')
                        .select('_parentChildren.B as id')
                        .innerJoin('childrenTree', 'childrenTree.id', 'A'),
                ),
        )
        .selectFrom('childrenTree')
        .selectAll();
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

const mapProjectsSortParamsToTableColumns = (
    sort: SortableProjectsPropertiesArray = [],
): Array<OrderByExpression<DB, 'Project', unknown>> => {
    if (!sort.length) {
        return ['Project.updatedAt desc'];
    }

    const mapToTableColumn: Record<
        NonNullable<SortableProjectsPropertiesArray>[number]['key'],
        AnyColumnWithTable<DB, 'Project'> | Record<OrderByDirection, Expression<string>>
    > = {
        title: 'Project.title',
        updatedAt: 'Project.updatedAt',
        createdAt: 'Project.createdAt',
        stargizers: {
            asc: sql`(select count("A") from "_projectStargizers" where "B" = "Project".id) asc`,
            desc: sql`(select count("A") from "_projectStargizers" where "B" = "Project".id) desc`,
        },
        watchers: {
            asc: sql`(select count("A") from "_projectStargizers" where "B" = "Project".id) asc`,
            desc: sql`(select count("A") from "_projectStargizers" where "B" = "Project".id) desc`,
        },
        owner: {
            asc: sql`(select name from "User" where "User"."activityId" = "Project"."activityId") asc`,
            desc: sql`(select name from "User" where "User"."activityId" = "Project"."activityId") desc`,
        },
        goals: {
            asc: sql`(select count(*) from "Goal" where "Goal"."projectId" = "Project".id) asc`,
            desc: sql`(select count(*) from "Goal" where "Goal"."projectId" = "Project".id) desc`,
        },
    };

    return sort.map<OrderByExpression<DB, 'Project', unknown>>(({ key, dir }) => {
        const rule = mapToTableColumn[key];

        if (typeof rule === 'string') {
            return `${rule} ${dir}`;
        }

        return rule[dir];
    });
};

interface GetUserDashboardProjectsParams extends GetUserProjectsQueryParams {
    in?: Array<{ id: string }>;
    goalsQuery?: QueryWithFilters;
    projectsSort?: SortableProjectsPropertiesArray;
    limit?: number;
    offset?: number;
}

/** Limit for subquery goals by project */
const dashboardGoalByProjectLimit = 30;

const getGoalsFiltersWhereExpressionBuilder =
    (
        goalsQuery?: QueryWithFilters,
    ): ExpressionOrFactory<
        DB & {
            participant: Nullable<Activity>;
            tag: Nullable<{
                id: string;
                title: string;
                description: string | null;
                activityId: string;
                createdAt: Date;
                updatedAt: Date;
            }>;
        },
        'Goal' | 'tag' | 'participant',
        SqlBool
    > =>
    ({ or, and, eb, selectFrom, cast, val }) => {
        const estimate: Array<Date> = [];

        if (goalsQuery?.estimate != null) {
            const parsedEstimateFilter = decodeUrlDateRange(goalsQuery.estimate[0]);

            if (parsedEstimateFilter) {
                const end = new Date(getDateString(parsedEstimateFilter.end));
                const start = parsedEstimateFilter.start ? new Date(getDateString(parsedEstimateFilter.start)) : null;

                if (start != null) {
                    estimate.push(start, end);
                } else {
                    estimate.push(end);
                }
            }
        }

        const filters: Record<keyof NonNullable<typeof goalsQuery>, null | ReturnType<typeof eb>> = {
            project: eb('Goal.projectId', 'in', goalsQuery?.project || []),
            partnershipProject: goalsQuery?.partnershipProject?.length
                ? eb('Goal.id', 'in', ({ selectFrom }) =>
                      selectFrom('_partnershipProjects')
                          .where('B', 'in', goalsQuery.partnershipProject || [])
                          .select('A'),
                  )
                : null,
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
            hideCriteria: eb('Goal.id', 'not in', ({ selectFrom }) =>
                selectFrom('GoalAchieveCriteria')
                    .select('GoalAchieveCriteria.criteriaGoalId')
                    .where('GoalAchieveCriteria.criteriaGoalId', 'is not', null)
                    .where('GoalAchieveCriteria.deleted', 'is not', true),
            ),
            hideEmptyProjects: null,
            sort: null,
            starred: null,
            watching: null,
            limit: null,
            offset: null,
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
    };

export const getUserDashboardProjects = (params: GetUserDashboardProjectsParams) => {
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
        .with('partnership_goals', (db) =>
            db
                .selectFrom('_partnershipProjects')
                .where('B', 'in', ({ selectFrom }) => selectFrom('project_ids').select('pid'))
                .select('A'),
        )
        .with('goals', (db) =>
            db
                .selectFrom('Goal')
                .select(['Goal.id', 'Goal.projectId'])
                .where(({ or, eb }) =>
                    or([
                        eb('Goal.id', 'in', ({ selectFrom }) => selectFrom('subs_goals').select('B')),
                        eb('Goal.projectId', 'in', ({ selectFrom }) => selectFrom('project_ids').select('pid')),
                        eb('Goal.id', 'in', ({ selectFrom }) => selectFrom('partnership_goals').select('A')),
                        eb('Goal.ownerId', '=', params.activityId),
                        eb('Goal.activityId', '=', params.activityId),
                    ]),
                )
                .where(getGoalsFiltersWhereExpressionBuilder(params.goalsQuery))
                .where('Goal.archived', 'is not', true),
        )
        .selectFrom('Project')
        .leftJoinLateral(
            ({ selectFrom }) =>
                selectFrom('goals')
                    .selectAll('goals')
                    .where((eb) =>
                        eb.or([
                            eb('goals.id', 'in', () =>
                                selectFrom('_partnershipProjects').whereRef('B', '=', 'Project.id').select('A'),
                            ),
                            eb('goals.projectId', '=', eb.ref('Project.id')),
                        ]),
                    )
                    .limit(params.goalsQuery?.limit ?? dashboardGoalByProjectLimit)
                    .as('goal'),
            (join) => join.onTrue(),
        )
        .leftJoinLateral(
            ({ selectFrom }) =>
                selectFrom('_partnershipProjects')
                    .select('B')
                    .whereRef('A', 'in', ({ selectFrom }) =>
                        selectFrom('Goal').select('Goal.id').whereRef('Goal.projectId', '=', 'Project.id'),
                    )
                    .as('partnerProjectIds'),
            (join) => join.on('Project.id', 'not in', ({ selectFrom }) => selectFrom('project_ids').select('pid')),
        )
        .select(({ fn, eb }) => [
            'Project.id',
            eb
                .case()
                .when(fn.count('partnerProjectIds.B'), '>', 0)
                .then(fn.agg('array_agg', ['partnerProjectIds.B']).distinct())
                .else(null)
                .end()
                .as('partnerProjectIds'),

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
        .orderBy(mapProjectsSortParamsToTableColumns(params.projectsSort))
        .$if(!!params.goalsQuery?.hideEmptyProjects, (qb) => qb.having(({ fn }) => fn.count('goal.id'), '>', 0))
        .limit(params.limit || 5)
        .offset(params.offset || 0);
};

/**
 * Если мы получаем пользовательские проекты по следующим условиям
 * 1. Пользователь - владелец или участник проекта V
 * 2. Пользователь - поставил звездочку или следит за проектом V
 * 3. Проект является партенским по отношению к проектам пользователя владельцем которых он является
 * 4. Пользователь является краним за цель в любом проекте
 * 5. Пользователь поставил звездочку или подписался на цель внутри любого проекта
 * 6. Пользователь является участником цели любого проекта
 */

export const getUserDashBoardProjectsAgain = (params: GetUserDashboardProjectsParams) => {
    return db
        .selectFrom('Project')
        .selectAll('Project')
        .where('Project.archived', 'is not', true)
        .where(({ or, eb }) =>
            or([
                eb('Project.activityId', '=', params.activityId),
                eb('Project.id', 'in', ({ selectFrom }) =>
                    selectFrom('_projectParticipants')
                        .select('B as id')
                        .where('A', '=', params.activityId)
                        .union(selectFrom('_projectStargizers').select('B as id').where('A', '=', params.activityId))
                        .union(selectFrom('_projectWatchers').select('B as id').where('A', '=', params.activityId))
                        .union(
                            selectFrom('_partnershipProjects')
                                .select('A as id')
                                .where(
                                    'A',
                                    'in',
                                    selectFrom('Project')
                                        .select('Project.id')
                                        .where('Project.activityId', '=', params.activityId),
                                ),
                        ),
                ),
                eb('Project.id', 'in', ({ selectFrom }) =>
                    selectFrom('Goal')
                        .select('Goal.projectId as id')
                        .where('Goal.archived', 'is not', true)
                        .where(({ or, eb }) =>
                            or([
                                eb('Goal.activityId', '=', params.activityId),
                                eb('Goal.ownerId', '=', params.activityId),
                                eb('Goal.id', 'in', ({ selectFrom }) =>
                                    selectFrom('_goalParticipants')
                                        .select('B as id')
                                        .where('A', '=', params.activityId)
                                        .union(
                                            selectFrom('_goalStargizers')
                                                .select('B as id')
                                                .where('A', '=', params.activityId),
                                        )
                                        .union(
                                            selectFrom('_goalWatchers')
                                                .select('B as id')
                                                .where('A', '=', params.activityId),
                                        ),
                                ),
                            ]),
                        ),
                ),
            ]),
        );
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
                .select(({ fn, cast }) => [cast(fn.count('Goal.id'), 'integer').as('count')])
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
        )
        .$castTo<{ wholeGoalsCount: number }>();
};

interface GetProjectSuggestionsParams {
    activityId: string;
    role: Role;
    query: string;
    filter?: string[];
    limit?: number;
}

export const getProjectSuggestions = ({
    role,
    filter = [],
    query,
    limit = 5,
    activityId,
}: GetProjectSuggestionsParams) => {
    return db
        .selectFrom('Project')
        .selectAll()
        .where('Project.archived', 'is not', true)
        .where('Project.title', 'ilike', `%${query}%`)
        .$if(role === Role.USER, (qb) =>
            qb.where(({ or, eb, not, exists }) =>
                or([
                    eb('Project.activityId', '=', activityId),
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
        .$if(filter.length > 0, (qb) => qb.where('Project.id', 'not in', filter))
        .groupBy('Project.id')
        .orderBy(sql`CHAR_LENGTH(title)`)
        .limit(limit);
};

interface GetAllProjectsQueryParams {
    activityId: string;
    role: Role;
    firstLevel: boolean;
    limit: number;
    cursor: number;
    ids?: string[];
    projectsSort?: SortableProjectsPropertiesArray;
}

export const getAllProjectsQuery = ({
    activityId,
    role,
    firstLevel,
    ids = [],
    limit,
    cursor,
    projectsSort,
}: GetAllProjectsQueryParams) => {
    return db
        .selectFrom(({ selectFrom }) =>
            selectFrom('Project')
                .leftJoinLateral(
                    () => getUserActivity().distinctOn('Activity.id').as('participants'),
                    (join) =>
                        join.onRef('participants.id', 'in', ({ selectFrom }) =>
                            selectFrom('_projectParticipants').select('A').whereRef('B', '=', 'Project.id'),
                        ),
                )
                .selectAll('Project')
                .select(({ case: caseFn, fn }) => [
                    caseFn()
                        .when(fn.count('participants.id'), '>', 0)
                        .then(fn.agg('array_agg', [fn.toJson('participants')]))
                        .else(null)
                        .end()
                        .as('participants'),
                    jsonBuildObject({
                        stargizers: sql<number>`(select count("A") from "_projectStargizers" where "B" = "Project".id)`,
                        watchers: sql<number>`(select count("A") from "_projectWatchers" where "B" = "Project".id)`,
                        children: sql<number>`(select count("B") from "_parentChildren" where "A" = "Project".id)`,
                        participants: sql<number>`(select count("A") from "_projectParticipants"  where "B" = "Project".id)`,
                        goals: sql<number>`(select count("Goal".id) from "Goal" where "Goal"."projectId" = "Project".id)`,
                    }).as('_count'),
                ])
                .where('Project.archived', 'is not', true)
                .$if(ids && ids.length > 0, (qb) => qb.where('Project.id', 'in', ids))
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
                            eb('Project.personal', 'is not', true),
                        ]),
                    ),
                )
                .$if(firstLevel, (qb) =>
                    qb.where(({ not, exists, selectFrom }) =>
                        not(exists(selectFrom('_parentChildren').select('A').whereRef('B', '=', 'Project.id'))),
                    ),
                )
                .limit(limit)
                .offset(cursor)
                .orderBy(mapProjectsSortParamsToTableColumns(projectsSort))
                .groupBy(['Project.id'])
                .as('projects'),
        )
        .innerJoinLateral(
            () => getUserActivity().as('activity'),
            (join) => join.onRef('activity.id', '=', 'projects.activityId'),
        )
        .selectAll('projects')
        .select(({ fn, selectFrom, exists, val }) => [
            fn.toJson('activity').as('activity'),
            exists(
                selectFrom('_projectWatchers')
                    .select('B')
                    .where('A', '=', activityId)
                    .whereRef('B', '=', 'projects.id'),
            ).as('_isWatching'),
            exists(
                selectFrom('_projectStargizers')
                    .select('B')
                    .where('A', '=', activityId)
                    .whereRef('B', '=', 'projects.id'),
            ).as('_isStarred'),
            sql<boolean>`("projects"."activityId" = ${val(activityId)})`.as('_isOwner'),
            sql<boolean>`((${val(role === Role.ADMIN)} or "projects"."activityId" = ${val(
                activityId,
            )}) and not "projects"."personal")`.as('_isEditable'),
        ]);
};

export const getProjectChildrenTreeQuery = ({ id, goalsQuery }: { id: string; goalsQuery?: QueryWithFilters }) => {
    return db
        .withRecursive('childs', (qb) => {
            return qb
                .selectFrom('_parentChildren')
                .select(({ fn }) => [
                    '_parentChildren.B as id',
                    sql<number>`1::int`.as('level'),
                    fn.agg<string[]>('array_agg', ['_parentChildren.A']).as('parent_chain'),
                ])
                .where('A', '=', id)
                .groupBy('id')
                .union(
                    qb
                        .selectFrom('_parentChildren as inner_children')
                        .innerJoin('childs', 'childs.id', 'inner_children.A')
                        .select(({ fn, ref }) => [
                            ref('inner_children.B').as('id'),
                            sql<number>`childs."level"::int + 1`.as('level'),
                            fn
                                .agg<string[]>('array_append', ['childs.parent_chain', 'inner_children.A'])
                                .as('parent_chain'),
                        ]),
                );
        })
        .selectFrom('Project')
        .innerJoin('childs as ch', 'ch.id', 'Project.id')
        .leftJoinLateral(
            ({ selectFrom }) =>
                selectFrom('Goal')
                    .select(({ fn }) => fn.count('Goal.id').as('goal_count'))
                    .leftJoinLateral(
                        () =>
                            getUserActivity()
                                .whereRef('Activity.id', 'in', (qb) =>
                                    // @ts-ignore
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
                    .whereRef('Goal.projectId', '=', 'Project.id')
                    .where('Goal.archived', 'is not', true)
                    .where(getGoalsFiltersWhereExpressionBuilder(goalsQuery))
                    .as('goal'),
            (join) => join.onTrue(),
        )
        .select(({ cast, ref }) => [
            'Project.id',
            'Project.title',
            cast(ref('goal.goal_count'), 'integer').as('goal_count'),
            'ch.parent_chain as chain',
            'ch.level as deep',
        ])
        .groupBy(['Project.id', 'ch.level', 'ch.parent_chain', 'goal.goal_count'])
        .orderBy('ch.level asc');
};

export const getProjectById = ({ id, ...user }: { id: string; activityId: string; role: Role }) => {
    return db
        .with('calculatedFields', (qb) =>
            qb
                .selectFrom('Project')
                .leftJoinLateral(
                    ({ selectFrom }) =>
                        selectFrom('Project')
                            .selectAll('Project')
                            .where('Project.id', 'in', () => getParentProjectsId({ in: [{ id }] }))
                            .as('parent'),
                    (join) => join.onTrue(),
                )
                .leftJoinLateral(
                    () => getUserActivity().distinctOn('Activity.id').as('participant'),
                    (join) =>
                        join.onRef('participant.id', 'in', (qb) =>
                            qb.selectFrom('_projectParticipants').select('A').whereRef('B', '=', 'Project.id'),
                        ),
                )
                .leftJoinLateral(
                    (qb) =>
                        qb
                            .selectFrom('Team')
                            .selectAll('Team')
                            .where('Team.id', 'in', ({ selectFrom }) =>
                                selectFrom('_projects')
                                    .select('_projects.B')
                                    .whereRef('_projects.A', '=', 'Project.id'),
                            )
                            .as('teams'),
                    (join) => join.onTrue(),
                )
                .selectAll('Project')
                .select(({ fn, exists, selectFrom, val, case: caseFn }) => [
                    caseFn()
                        .when(fn.count('parent.id'), '>', 0)
                        .then(fn.agg('array_agg', [fn.toJson('parent')]))
                        .else(null)
                        .end()
                        .as('parent'),
                    caseFn()
                        .when(fn.count('teams.id'), '>', 0)
                        .then(fn.agg('array_agg', [fn.toJson('teams')]))
                        .else(null)
                        .end()
                        .as('teams'),
                    caseFn()
                        .when(fn.count('participant.id'), '>', 0)
                        .then(fn.agg('array_agg', [fn.toJson('participant')]))
                        .else(null)
                        .end()
                        .as('participants'),
                    sql<boolean>`("Project"."activityId" = ${val(user.activityId)})`.as('_isOwner'),
                    exists(
                        selectFrom('_projectParticipants')
                            .select('A')
                            .whereRef('B', '=', 'Project.id')
                            .where('A', '=', user.activityId),
                    )
                        .$castTo<boolean>()
                        .as('_isParticipant'),
                    exists(
                        selectFrom('_projectWatchers')
                            .select('B')
                            .where('A', '=', user.activityId)
                            .whereRef('B', '=', 'Project.id'),
                    )
                        .$castTo<boolean>()
                        .as('_isWatching'),
                    exists(
                        selectFrom('_projectStargizers')
                            .select('B')
                            .where('A', '=', user.activityId)
                            .whereRef('B', '=', 'Project.id'),
                    )
                        .$castTo<boolean>()
                        .as('_isStarred'),
                    jsonBuildObject({
                        stargizers: sql<number>`(select count("A") from "_projectStargizers" where "B" = "Project".id)`,
                        watchers: sql<number>`(select count("A") from "_projectWatchers" where "B" = "Project".id)`,
                        children: sql<number>`(select count("B") from "_parentChildren" where "A" = "Project".id)`,
                        participants: sql<number>`(select count("A") from "_projectParticipants"  where "B" = "Project".id)`,
                        goals: sql<number>`(select count("Goal".id) from "Goal" where "Goal"."projectId" = "Project".id and "Goal"."archived" is not true)`,
                    }).as('_count'),
                ])
                .where('Project.id', '=', id)
                .groupBy('Project.id'),
        )
        .selectFrom('calculatedFields as project')
        .innerJoinLateral(
            () => getUserActivity().as('activity'),
            (join) => join.onRef('activity.id', '=', 'project.activityId'),
        )
        .selectAll('project')
        .select(({ fn, val }) => [
            fn.toJson('activity').as('activity'),
            sql<boolean>`((${val(user.role === Role.ADMIN)} or "project"."activityId" = ${val(
                user.activityId,
            )} or "project"."_isParticipant") and not "project"."personal")`.as('_isEditable'),
        ]);
};

export const getChildrenProjectByParentProjectId = ({ id }: { id: string }) => {
    return db
        .selectFrom('Project')
        .select(['Project.id', 'Project.title'])
        .where('Project.id', 'in', ({ selectFrom }) =>
            selectFrom('_parentChildren').select('_parentChildren.B').where('_parentChildren.A', '=', id),
        );
};
