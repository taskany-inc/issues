import { AnyColumnWithTable, Expression, OrderByExpression, sql } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/postgres';
import { OrderByDirection, DirectedOrderByStringReference } from 'kysely/dist/cjs/parser/order-by-parser';

import { db } from '../connection/kysely';
import { QueryWithFilters } from '../../src/schema/common';
import { DB, Role } from '../../generated/kysely/types';
import { decodeUrlDateRange, getDateString } from '../../src/utils/dateTime';

import { getUserActivity } from './activity';

const mapSortParamsToTableColumns = (
    sort: QueryWithFilters['sort'] = [],
): Array<OrderByExpression<DB, 'Goal', unknown>> => {
    if (!sort.length) {
        return ['Goal.updatedAt desc'];
    }

    const mapToTableColumn: Record<
        NonNullable<QueryWithFilters['sort']>[number]['key'],
        AnyColumnWithTable<DB, 'Goal'> | Record<OrderByDirection, Expression<string>>
    > = {
        title: 'Goal.title',
        updatedAt: 'Goal.updatedAt',
        createdAt: 'Goal.createdAt',
        state: {
            asc: sql`(select title from "State" where "State".id = "Goal"."stateId") asc`,
            desc: sql`(select title from "State" where "State".id = "Goal"."stateId") desc`,
        },
        priority: {
            asc: sql`(select value from "Priority" where "Priority".id = "Goal"."priorityId") asc`,
            desc: sql`(select value from "Priority" where "Priority".id = "Goal"."priorityId") desc`,
        },
        project: {
            asc: sql`(select title from "Project" where "Project".id = "Goal"."projectId") asc`,
            desc: sql`(select title from "Project" where "Project".id = "Goal"."projectId") desc`,
        },
        activity: {
            asc: sql`(select name from "User" where "User"."activityId" = "Goal"."activityId") asc`,
            desc: sql`(select name from "User" where "User"."activityId" = "Goal"."activityId") desc`,
        },
        owner: {
            asc: sql`(select name from "User" where "User"."activityId" = "Goal"."ownerId") asc`,
            desc: sql`(select name from "User" where "User"."activityId" = "Goal"."ownerId") desc`,
        },
    };

    return sort.map<OrderByExpression<DB, 'Goal', unknown>>(({ key, dir }) => {
        const rule = mapToTableColumn[key];

        if (typeof rule === 'string') {
            return `${rule} ${dir}` as DirectedOrderByStringReference<DB, 'Goal', unknown>;
        }

        return rule[dir];
    });
};

interface GetGoalsQueryParams {
    role: Role;
    activityId: string;
    projectId: string;
    limit?: number;
    offset?: number;
    goalsQuery?: QueryWithFilters;
}

export const getGoalsQuery = (params: GetGoalsQueryParams) =>
    db
        .with('proj_goals', () =>
            db
                .selectFrom('Goal')
                .selectAll('Goal')
                .leftJoinLateral(
                    () => getUserActivity().as('participant'),
                    (join) =>
                        join.onRef('participant.id', 'in', (qb) =>
                            qb.selectFrom('_goalParticipants').select('A').whereRef('B', '=', 'Goal.id'),
                        ),
                )
                .leftJoin('Tag as tag', (join) =>
                    join.onRef('tag.id', 'in', ({ selectFrom }) =>
                        selectFrom('_GoalToTag').select('B').whereRef('A', '=', 'Goal.id'),
                    ),
                )
                .leftJoinLateral(
                    ({ selectFrom }) =>
                        selectFrom('GoalAchieveCriteria')
                            .distinctOn('GoalAchieveCriteria.id')
                            .leftJoin('Goal as criteriaGoal', 'GoalAchieveCriteria.criteriaGoalId', 'Goal.id')
                            .selectAll('GoalAchieveCriteria')
                            .select([sql`"criteriaGoal"`.as('criteriaGoal')])
                            .where('GoalAchieveCriteria.deleted', 'is not', true)
                            .whereRef('GoalAchieveCriteria.goalId', '=', 'Goal.id')
                            .as('criteria'),
                    (join) => join.onTrue(),
                )
                .leftJoin('Project as partnershipProject', (join) =>
                    join.onRef('partnershipProject.id', 'in', ({ selectFrom }) =>
                        selectFrom('_partnershipProjects').select('B').whereRef('A', '=', 'Goal.id'),
                    ),
                )
                .select(({ case: caseFn, exists, selectFrom, val, fn }) => [
                    sql<boolean>`("Goal"."ownerId" = ${val(params.activityId)})`.as('_isOwner'),
                    sql<boolean>`("Goal"."activityId" = ${val(params.activityId)})`.as('_isIssuer'),
                    exists(
                        selectFrom('_goalParticipants')
                            .select('A')
                            .whereRef('B', '=', 'Goal.id')
                            .where('A', '=', params.activityId),
                    )
                        .$castTo<boolean>()
                        .as('_isParticipant'),
                    exists(
                        selectFrom('_goalWatchers')
                            .select('B')
                            .where('A', '=', params.activityId)
                            .whereRef('B', '=', 'Goal.id'),
                    )
                        .$castTo<boolean>()
                        .as('_isWatching'),
                    exists(
                        selectFrom('_goalStargizers')
                            .select('B')
                            .where('A', '=', params.activityId)
                            .whereRef('B', '=', 'Goal.id'),
                    )
                        .$castTo<boolean>()
                        .as('_isStarred'),
                    sql`(count(criteria.id) > 0)`.as('_hasAchievementCriteria'),
                    sql<boolean>`((${val(params.role === Role.ADMIN)} or "Goal"."activityId" = ${val(
                        params.activityId,
                    )}) and not "Goal"."personal")`.as('_isEditable'),
                    caseFn()
                        .when(fn.count('criteria.id'), '>', 0)
                        .then(fn.agg('array_agg', [sql`"criteria"`]).distinct())
                        .else(null)
                        .end()
                        .as('criteria'),
                    caseFn()
                        .when(fn.count('tag.id'), '>', 0)
                        .then(fn.agg('array_agg', [sql`"tag"`]).distinct())
                        .else(null)
                        .end()
                        .as('tags'),
                    caseFn()
                        .when(fn.count('participant.id'), '>', 0)
                        .then(fn.agg('array_agg', [sql`"participant"`]).distinct())
                        .else(null)
                        .end()
                        .as('participants'),
                    caseFn()
                        .when(fn.count('partnershipProject.id'), '>', 0)
                        .then(fn.agg('array_agg', [sql`"partnershipProject"`]).distinct())
                        .else(null)
                        .end()
                        .as('partnershipProjects'),
                ])
                .where('Goal.projectId', '=', params.projectId)
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
                        project: null,
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
                })
                .where('Goal.archived', 'is not', true)
                .orderBy(mapSortParamsToTableColumns(params.goalsQuery?.sort))
                .groupBy(['Goal.id'])
                .limit(params.limit ?? 10)
                .offset(params.offset ?? 0),
        )
        .selectFrom('proj_goals')
        .innerJoin('State', 'State.id', 'proj_goals.stateId')
        .innerJoin('Priority', 'Priority.id', 'proj_goals.priorityId')
        .innerJoin(
            () => getUserActivity().as('owner'),
            (join) => join.onRef('owner.id', '=', 'proj_goals.ownerId'),
        )
        .leftJoin(
            () => getUserActivity().as('activity'),
            (join) => join.onRef('activity.id', '=', 'proj_goals.activityId'),
        )
        .innerJoin('Project', 'Project.id', 'proj_goals.projectId')
        .selectAll('proj_goals')
        .select(({ selectFrom, fn }) => [
            sql<string>`concat("proj_goals"."projectId", '-', "proj_goals"."scopeId")::text`.as('_shortId'),
            jsonBuildObject({
                comments: selectFrom('Comment')
                    .select(({ fn }) => [fn.count('Comment.id').as('count')])
                    .whereRef('Comment.goalId', '=', 'proj_goals.id'),
            }).as('_count'),
            sql`to_jsonb(proj_goals.tags)`.as('tags'),
            sql`to_jsonb(proj_goals.criteria)`.as('criteria'),
            sql`to_jsonb(proj_goals.participants)`.as('participants'),
            sql`to_jsonb(proj_goals."partnershipProjects")`.as('partnershipProjects'),
            fn.toJson('owner').as('owner'),
            fn.toJson('activity').as('activity'),
            fn.toJson('State').as('state'),
            fn.toJson('Priority').as('priority'),
            fn.toJson('Project').as('project'),
        ]);

export const goalBaseQuery = () => {
    return db
        .selectFrom('Goal')
        .innerJoin('State', 'State.id', 'Goal.stateId')
        .selectAll('Goal')
        .select(({ fn, val, cast }) => [
            fn('concat', ['Goal.projectId', cast(val('-'), 'text'), 'Goal.scopeId']).as('_shortId'),
            sql`to_json("State")`.as('state'),
        ]);
};

export const getDeepParentGoalIds = (ids: string[]) => {
    return db
        .withRecursive('parentsTree', (qb) =>
            qb
                .selectFrom('GoalAchieveCriteria')
                .select('GoalAchieveCriteria.goalId as id')
                .where('GoalAchieveCriteria.criteriaGoalId', 'in', ids)
                .where('GoalAchieveCriteria.deleted', 'is not', true)
                .union((qb) =>
                    qb
                        .selectFrom('GoalAchieveCriteria')
                        .select('GoalAchieveCriteria.goalId as id')
                        .where('GoalAchieveCriteria.deleted', 'is not', true)
                        .innerJoin('parentsTree', 'parentsTree.id', 'GoalAchieveCriteria.criteriaGoalId'),
                ),
        )
        .selectFrom('parentsTree')
        .selectAll();
};

export const getDeepChildrenGoalIds = (ids: string[]) => {
    return db
        .withRecursive('childrenTree', (qb) =>
            qb
                .selectFrom('GoalAchieveCriteria')
                .select('GoalAchieveCriteria.criteriaGoalId as id')
                .where('GoalAchieveCriteria.goalId', 'in', ids)
                .where('GoalAchieveCriteria.criteriaGoalId', 'is not', null)
                .where('GoalAchieveCriteria.deleted', 'is not', true)
                .union((qb) =>
                    qb
                        .selectFrom('GoalAchieveCriteria')
                        .select('GoalAchieveCriteria.criteriaGoalId as id')
                        .where('GoalAchieveCriteria.criteriaGoalId', 'is not', null)
                        .where('GoalAchieveCriteria.deleted', 'is not', true)
                        .innerJoin('childrenTree', 'childrenTree.id', 'GoalAchieveCriteria.goalId'),
                ),
        )
        .selectFrom('childrenTree')
        .selectAll();
};

export const getGoalActivityFilterIdsQuery = db
    .selectFrom('GoalAchieveCriteria')
    .select(['GoalAchieveCriteria.criteriaGoalId'])
    .where('GoalAchieveCriteria.deleted', 'is not', true)
    .where('GoalAchieveCriteria.criteriaGoalId', 'is not', null);
