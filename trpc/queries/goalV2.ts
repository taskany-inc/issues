import { Expression, OrderByExpression, sql } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/postgres';
import { OrderByDirection } from 'kysely/dist/cjs/parser/order-by-parser';
import { decodeUrlDateRange, getDateString } from '@taskany/bricks';

import { db } from '../connection/kysely';
import { QueryWithFilters } from '../../src/schema/common';
import { DB, Role } from '../../generated/kysely/types';
import { calculateProjectRules, ProjectRoles } from '../utils';

import { getUserActivity } from './activity';

export const mapSortParamsToTableColumns = <T extends DB, K extends keyof T, R = T[K]>(
    sort: QueryWithFilters['sort'],
    key: K,
    activityId: string,
): Array<OrderByExpression<T, K, R>> => {
    const dbKey = db.dynamic.ref(key as string);

    if (sort == null || !sort.length) {
        return [sql`${dbKey}."updatedAt" desc`];
    }

    const mapToTableColumn: Record<
        NonNullable<QueryWithFilters['sort']>[number]['key'],
        Record<OrderByDirection, Expression<keyof T[K]>>
    > = {
        title: {
            desc: sql`${dbKey}.title desc`,
            asc: sql`${dbKey}.title asc`,
        },
        updatedAt: {
            desc: sql`${dbKey}."updatedAt" desc`,
            asc: sql`${dbKey}."updatedAt" asc`,
        },
        createdAt: {
            desc: sql`${dbKey}."createdAt" desc`,
            asc: sql`${dbKey}."createdAt" asc`,
        },
        state: {
            asc: sql`(select title from "State" where "State".id = ${dbKey}."stateId") asc`,
            desc: sql`(select title from "State" where "State".id = ${dbKey}."stateId") desc`,
        },
        priority: {
            asc: sql`(select value from "Priority" where "Priority".id = ${dbKey}."priorityId") asc`,
            desc: sql`(select value from "Priority" where "Priority".id = ${dbKey}."priorityId") desc`,
        },
        project: {
            asc: sql`(select title from "Project" where "Project".id = ${dbKey}."projectId") asc`,
            desc: sql`(select title from "Project" where "Project".id = ${dbKey}."projectId") desc`,
        },
        activity: {
            asc: sql`(select name from "User" where "User"."activityId" = ${dbKey}."activityId") asc`,
            desc: sql`(select name from "User" where "User"."activityId" = ${dbKey}."activityId") desc`,
        },
        owner: {
            asc: sql`(select name from "User" where "User"."activityId" = ${dbKey}."ownerId") asc`,
            desc: sql`(select name from "User" where "User"."activityId" = ${dbKey}."ownerId") desc`,
        },
        rank: {
            asc: sql`(select value from "GoalRank" where "activityId" = ${activityId} and "goalId" = ${dbKey}.id) asc`,
            desc: sql`(select value from "GoalRank" where "activityId" = ${activityId} and "goalId" = ${dbKey}.id) desc`,
        },
        rankGlobal: {
            asc: sql`(select value from "GoalRank" where "activityId" is NULL and "goalId" = ${dbKey}.id) asc`,
            desc: sql`(select value from "GoalRank" where "activityId" is NULL and "goalId" = ${dbKey}.id) desc`,
        },
    };

    return sort.map<OrderByExpression<T, K, R>>(({ key, dir }) => mapToTableColumn[key][dir]);
};

const subSelectUserProejcts = (activityId: string) =>
    db
        .selectFrom('_projectParticipants')
        .select('B')
        .where('A', '=', activityId)
        .union(db.selectFrom('_projectStargizers').select('B').where('A', '=', activityId))
        .union(db.selectFrom('_projectWatchers').select('B').where('A', '=', activityId))
        .union(db.selectFrom('Project').select('Project.id as B').where('Project.activityId', '=', activityId));

const subSelectUserGoals = (activityId: string) =>
    db
        .selectFrom('_goalParticipants')
        .select('B')
        .where('A', '=', activityId)
        .union(db.selectFrom('_goalStargizers').select('B').where('A', '=', activityId))
        .union(db.selectFrom('_goalWatchers').select('B').where('A', '=', activityId))
        .union(
            db
                .selectFrom('Goal')
                .select('Goal.id as B')
                .where(({ or, eb }) =>
                    or([eb('Goal.activityId', '=', activityId), eb('Goal.ownerId', '=', activityId)]),
                ),
        );

const subSelectPartnershipGoals = (projectId: string) =>
    db.selectFrom('_partnershipProjects').select('A').where('B', '=', projectId);

interface GetGoalsQueryParams {
    role: Role;
    activityId: string;
    projectId: string;
    isOnlySubsGoals?: boolean;
    limit?: number;
    offset?: number;
    goalsQuery?: QueryWithFilters;
    readRights?: Array<ProjectRoles>;
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
                .leftJoinLateral(
                    ({ selectFrom }) =>
                        selectFrom('Tag')
                            .selectAll('Tag')
                            .whereRef('Tag.id', 'in', ({ selectFrom }) =>
                                selectFrom('_GoalToTag').select('B').whereRef('A', '=', 'Goal.id'),
                            )
                            .as('tag'),
                    (join) => join.onTrue(),
                )
                .leftJoinLateral(
                    ({ selectFrom }) =>
                        selectFrom('GoalAchieveCriteria')
                            .distinctOn('GoalAchieveCriteria.id')
                            .leftJoin('Goal as criteriaGoal', 'GoalAchieveCriteria.criteriaGoalId', 'criteriaGoal.id')
                            .selectAll('GoalAchieveCriteria')
                            .select([sql`"criteriaGoal"`.as('criteriaGoal')])
                            .where('GoalAchieveCriteria.deleted', 'is not', true)
                            .whereRef('GoalAchieveCriteria.goalId', '=', 'Goal.id')
                            .as('criteria'),
                    (join) => join.onTrue(),
                )
                .leftJoinLateral(
                    ({ selectFrom }) =>
                        selectFrom('Project')
                            .selectAll('Project')
                            .whereRef('Project.id', 'in', ({ selectFrom }) =>
                                selectFrom('_partnershipProjects').select('B').whereRef('A', '=', 'Goal.id'),
                            )
                            .as('partnershipProjects'),
                    (join) => join.onTrue(),
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
                        selectFrom('_projectParticipants')
                            .select('A')
                            .whereRef('B', '=', 'Goal.projectId')
                            .where('A', '=', params.activityId),
                    )
                        .$castTo<boolean>()
                        .as('_isParentParticipant'),
                    exists(
                        selectFrom('Project')
                            .select('Project.activityId')
                            .whereRef('Project.id', '=', 'Goal.projectId')
                            .where('Project.activityId', '=', params.activityId),
                    )
                        .$castTo<boolean>()
                        .as('_isParentOwner'),
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
                        .when(fn.count('partnershipProjects.id'), '>', 0)
                        .then(fn.agg('array_agg', [sql`"partnershipProjects"`]).distinct())
                        .else(null)
                        .end()
                        .as('partnershipProjects'),
                ])
                .where('Goal.archived', 'is not', true)
                .$if(params.readRights == null, (qb) =>
                    qb.where(({ or, eb }) =>
                        or([
                            eb('Goal.projectId', '=', params.projectId),
                            eb('Goal.id', 'in', subSelectPartnershipGoals(params.projectId)),
                        ]),
                    ),
                )
                .$if((params.readRights?.length ?? 0) > 0, (qb) =>
                    qb.where(({ or, selectFrom, eb, and }) => {
                        if (params.readRights) {
                            const parsedRights = calculateProjectRules(params.readRights);

                            if (parsedRights.projectFullAccess) {
                                return or([
                                    eb('Goal.projectId', '=', params.projectId),
                                    eb('Goal.id', 'in', subSelectPartnershipGoals(params.projectId)),
                                ]);
                            }

                            const filteredPartnershipBySubGoalsAndProjects = and([
                                eb('Goal.projectId', '=', params.projectId),
                                eb(
                                    'Goal.id',
                                    'in',
                                    selectFrom('_partnershipProjects')
                                        .select('A')
                                        .where(({ ref }) =>
                                            or([
                                                eb(ref('B'), 'in', subSelectUserProejcts(params.activityId)),
                                                eb(ref('A'), 'in', subSelectUserGoals(params.activityId)),
                                            ]),
                                        ),
                                ),
                            ]);

                            const filteredPartnershipGoalsToCurrentProject = and([
                                eb(
                                    'Goal.id',
                                    'in',
                                    selectFrom('_partnershipProjects')
                                        .select('A')
                                        .where('B', '=', params.projectId)
                                        .where('A', 'in', subSelectUserGoals(params.activityId)),
                                ),
                            ]);

                            const filterPRojectGoalsBySubscribe = and([
                                eb('Goal.projectId', '=', params.projectId),
                                eb('Goal.id', 'in', subSelectUserGoals(params.activityId)),
                            ]);

                            return or([
                                filteredPartnershipBySubGoalsAndProjects,
                                filteredPartnershipGoalsToCurrentProject,
                                filterPRojectGoalsBySubscribe,
                            ]);
                        }

                        return and([]);
                    }),
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
                        project: null,
                        partnershipProject: null,
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
                })
                .groupBy(['Goal.id']),
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
        .select(({ selectFrom, fn, val }) => [
            sql<string>`concat("proj_goals"."projectId", '-', "proj_goals"."scopeId")::text`.as('_shortId'),
            jsonBuildObject({
                comments: selectFrom('Comment')
                    .select(({ fn }) => [fn.count('Comment.id').as('count')])
                    .whereRef('Comment.goalId', '=', 'proj_goals.id'),
            }).as('_count'),
            sql<boolean>`${val(
                params.role === Role.ADMIN,
            )} or proj_goals."_isOwner" or proj_goals."_isIssuer" or proj_goals."_isParentOwner" or proj_goals."_isParentParticipant"`.as(
                '_isEditable',
            ),
            sql`to_jsonb(proj_goals.tags)`.as('tags'),
            sql`to_jsonb(proj_goals.criteria)`.as('criteria'),
            sql`to_jsonb(proj_goals.participants)`.as('participants'),
            sql`to_jsonb(proj_goals."partnershipProjects")`.as('partnershipProjects'),
            fn.toJson('owner').as('owner'),
            fn.toJson('activity').as('activity'),
            fn.toJson('State').as('state'),
            fn.toJson('Priority').as('priority'),
            fn.toJson('Project').as('project'),
        ])
        .orderBy(
            mapSortParamsToTableColumns<DB & { proj_goals: DB['Goal'] }, 'proj_goals'>(
                params.goalsQuery?.sort,
                'proj_goals',
                params.activityId,
            ),
        )
        .limit(params.limit ?? 10)
        .offset(params.offset ?? 0);

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

export const getGoalsForCSVExport = ({
    goalsQuery,
    activityId,
}: Pick<GetGoalsQueryParams, 'goalsQuery' | 'activityId' | 'role'>) => {
    return db
        .selectFrom('Goal')
        .innerJoin('Project', 'Goal.projectId', 'Project.id')
        .innerJoin('Priority', 'Goal.priorityId', 'Priority.id')
        .innerJoin('State', 'Goal.stateId', 'State.id')
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
        .select([
            'Goal.id',
            'Goal.title',
            'Goal.estimate',
            'Goal.estimateType',
            'Project.title as project',
            'Priority.title as priority',
            'State.title as state',
        ])
        .where(({ or, and, eb, selectFrom, cast, val }) => {
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
        })
        .orderBy(mapSortParamsToTableColumns(goalsQuery?.sort, 'Goal', activityId));
};
