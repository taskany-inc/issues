import { AnyColumnWithTable, Expression, Nullable, OrderByExpression, sql, SqlBool } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/postgres';
import { OrderByDirection } from 'kysely/dist/cjs/parser/order-by-parser';
import { decodeUrlDateRange, getDateString } from '@taskany/bricks';
import { ExpressionFactory } from 'kysely/dist/cjs/parser/expression-parser';

import { db } from '../connection/kysely';
import { Activity, DB, Role } from '../../generated/kysely/types';
import { QueryWithFilters, SortableProjectsPropertiesArray } from '../../src/schema/common';
import { ProjectRoles, ProjectRules } from '../utils';

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
            exists(
                selectFrom('_goalParticipants')
                    .select('B')
                    .where('A', '=', params.activityId)
                    .whereRef('B', 'in', ({ selectFrom }) =>
                        selectFrom('project_goals').select('id').whereRef('projectId', '=', 'Project.id'),
                    ),
            ).as('_isGoalParticipant'),
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

const getGoalsFiltersWhereExpressionBuilder =
    (
        goalsQuery?: QueryWithFilters,
    ): ExpressionFactory<
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
            cte_projects: any;
        },
        'Goal' | 'tag' | 'participant' | 'cte_projects',
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

export const getUserProjects = ({ activityId }: Pick<GetAllProjectsQueryParams, 'activityId'>) => {
    return db
        .with('subs_projects', (db) =>
            db
                .selectFrom('Project')
                .select(({ val, cast }) => [
                    'Project.id as pid',
                    cast<number>(val(ProjectRoles.project_owner), 'integer').as('role'),
                ])
                .where('Project.activityId', '=', activityId)
                .union(
                    db
                        .selectFrom('_projectParticipants')
                        .select(({ cast, val }) => [
                            'B as pid',
                            cast<number>(val(ProjectRoles.project_participant), 'integer').as('role'),
                        ])
                        .where('A', '=', activityId),
                )
                .union(
                    db
                        .selectFrom('_projectWatchers')
                        .select(({ cast, val }) => [
                            'B as pid',
                            cast<number>(val(ProjectRoles.project_watcher), 'integer').as('role'),
                        ])
                        .where('A', '=', activityId),
                )
                .union(
                    db
                        .selectFrom('_projectStargizers')
                        .select(({ cast, val }) => [
                            'B as pid',
                            cast<number>(val(ProjectRoles.project_stargizer), 'integer').as('role'),
                        ])
                        .where('A', '=', activityId),
                ),
        )
        .selectFrom('Project')
        .innerJoin('subs_projects', 'subs_projects.pid', 'Project.id')
        .select(['Project.id as pid', 'subs_projects.role'])
        .where(({ or, eb }) =>
            or([
                eb('Project.id', 'in', ({ selectFrom }) => selectFrom('subs_projects').select('pid')),
                eb('Project.activityId', '=', activityId),
            ]),
        )
        .union((eb) =>
            eb.parens(
                eb
                    .selectFrom('_parentChildren')
                    .innerJoin('subs_projects', 'subs_projects.pid', 'A')
                    .select(['B as pid', 'subs_projects.role']),
            ),
        )
        .$castTo<{ pid: string; role: number }>();
};

export const getUserProjectsByGoals = ({ activityId }: Pick<GetAllProjectsQueryParams, 'activityId'>) => {
    return db
        .with('cte_user_goals', () =>
            db
                .selectFrom('Goal')
                .select(({ cast, val }) => [
                    'Goal.id as gid',
                    cast<number>(val(ProjectRoles.goal_owner), 'integer').as('role'),
                ])
                .where('Goal.ownerId', '=', activityId)
                .union(
                    db
                        .selectFrom('Goal')
                        .select(({ cast, val }) => [
                            'Goal.id as gid',
                            cast<number>(val(ProjectRoles.goal_issuer), 'integer').as('role'),
                        ])
                        .where('Goal.activityId', '=', activityId),
                )
                .union(
                    db
                        .selectFrom('_goalParticipants')
                        .select(({ cast, val }) => [
                            'B as gid',
                            cast<number>(val(ProjectRoles.goal_participant), 'integer').as('role'),
                        ])
                        .where('A', '=', activityId),
                )
                .union(
                    db
                        .selectFrom('_goalStargizers')
                        .select(({ cast, val }) => [
                            'B as gid',
                            cast<number>(val(ProjectRoles.goal_stargizer), 'integer').as('role'),
                        ])
                        .where('A', '=', activityId),
                )
                .union(
                    db
                        .selectFrom('_goalWatchers')
                        .select(({ cast, val }) => [
                            'B as gid',
                            cast<number>(val(ProjectRoles.goal_watcher), 'integer').as('role'),
                        ])
                        .where('A', '=', activityId),
                )
                .union(
                    db
                        .selectFrom('_partnershipProjects')
                        .innerJoinLateral(
                            () => getUserProjects({ activityId }).as('cte_user_projects'),
                            (join) =>
                                join
                                    .on('role', 'in', [ProjectRoles.project_owner, ProjectRoles.project_participant])
                                    .onRef('_partnershipProjects.B', '=', 'cte_user_projects.pid'),
                        )
                        .select(({ cast, val }) => [
                            'A as gid',
                            cast<number>(val(ProjectRoles.goal_partner), 'integer').as('role'),
                        ]),
                ),
        )
        .selectFrom('Goal')
        .innerJoin('cte_user_goals', 'Goal.id', 'cte_user_goals.gid')
        .select(['Goal.projectId as pid', 'cte_user_goals.role as role'])
        .$castTo<{ pid: string; role: number }>();
};

export const getRealDashboardQueryByProjectIds = ({
    activityId,
    rules,
    goalsQuery,
    limit,
    offset,
}: {
    activityId: string;
    rules: Map<string, ProjectRules>;
    goalsQuery?: QueryWithFilters;
    limit: number;
    offset: number;
}) => {
    const toJoinValues = Array.from(
        rules,
        ([pid, rules]) => sql`(${sql.join([pid, rules.projectFullAccess, rules.projectOnlySubsGoals])})`,
    );
    const values = sql<{ pid: string; full_access: boolean; only_subs: boolean }>`(values ${sql.join(toJoinValues)})`;
    const aliasedValues = values.as<'proj_rules'>(sql`proj_rules(pid, full_access, only_subs)`);

    const query = db
        .with('cte_projects', () => db.selectFrom(aliasedValues).selectAll('proj_rules'))
        .selectFrom('Project')
        .innerJoin('cte_projects as projectRights', 'projectRights.pid', 'Project.id')
        .leftJoinLateral(
            ({ selectFrom }) =>
                selectFrom('_partnershipProjects')
                    .innerJoin('Goal', 'Goal.id', '_partnershipProjects.A')
                    .distinctOn('Goal.projectId')
                    .select('Goal.projectId as pid')
                    .whereRef('_partnershipProjects.B', '=', 'Project.id')
                    .as('partnershipProjectIds'),
            (join) => join.onTrue(),
        )
        .leftJoinLateral(
            ({ selectFrom }) =>
                selectFrom('Goal')
                    .select('Goal.id')
                    .where('Goal.archived', 'is not', true)
                    .whereRef('Goal.projectId', '=', 'Project.id')
                    .where(({ and, or, eb, ref, cast }) =>
                        or([
                            and([
                                eb(cast(ref('projectRights.full_access'), 'boolean'), 'is', true),
                                eb(
                                    'Goal.id',
                                    'in',
                                    selectFrom('_partnershipProjects').select('A').whereRef('B', '=', 'Project.id'),
                                ),
                            ]),
                            and([
                                eb(cast(ref('projectRights.only_subs'), 'boolean'), 'is', true),
                                eb('Goal.projectId', '=', ref('Project.id')),
                                or([
                                    eb('Goal.ownerId', '=', activityId),
                                    eb('Goal.activityId', '=', activityId),
                                    eb('Goal.id', 'in', ({ selectFrom }) =>
                                        selectFrom('_goalParticipants')
                                            .select('B')
                                            .where('A', '=', activityId)
                                            .union(selectFrom('_goalWatchers').select('B').where('A', '=', activityId))
                                            .union(
                                                selectFrom('_goalStargizers').select('B').where('A', '=', activityId),
                                            )
                                            .union(
                                                selectFrom('_partnershipProjects')
                                                    .select('A as B')
                                                    .where(
                                                        'B',
                                                        'in',
                                                        selectFrom('Project')
                                                            .select('Project.id')
                                                            .where('Project.activityId', '=', activityId),
                                                    ),
                                            ),
                                    ),
                                ]),
                            ]),
                        ]),
                    )
                    .where(getGoalsFiltersWhereExpressionBuilder(goalsQuery))
                    .as('goals'),
            (join) => join.onTrue(),
        )
        .select(({ fn, ref, cast, eb }) => [
            'Project.id',
            jsonBuildObject({
                fullProject: cast(ref('projectRights.full_access'), 'boolean'),
                onlySubs: cast(ref('projectRights.only_subs'), 'boolean'),
            }).as('readRights'),
            eb
                .case()
                .when(fn.count('partnershipProjectIds.pid'), '>', 0)
                .then(fn.agg('array_agg', ['partnershipProjectIds.pid']).distinct())
                .else(null)
                .end()
                .as('partnerProjectIds'),
            jsonBuildObject({
                stargizers: sql<number>`(select count("A") from "_projectStargizers" where "B" = "Project".id)`,
                watchers: sql<number>`(select count("A") from "_projectWatchers" where "B" = "Project".id)`,
                children: sql<number>`(select count("B") from "_parentChildren" where "A" = "Project".id)`,
                participants: sql<number>`(select count("A") from "_projectParticipants"  where "B" = "Project".id)`,
                goals: fn.count('goals.id').distinct(),
            }).as('_count'),
        ])
        .$if(!!goalsQuery?.hideEmptyProjects, (qb) => qb.having(({ fn }) => fn.count('goals.id').distinct(), '>', 0))
        .groupBy(['Project.id', 'projectRights.full_access', 'projectRights.only_subs'])
        .orderBy('Project.updatedAt desc')
        .limit(limit)
        .offset(offset);

    return query;
};
