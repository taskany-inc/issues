import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { router, protectedProcedure } from '../trpcBackend';
import { projectsChildrenIdsSchema, projectSuggestionsSchema, userProjectsSchema } from '../../src/schema/project';
import {
    getProjectsByIds,
    getStarredProjectsIds,
    getProjectSuggestions,
    getUserProjectsQuery,
    getWholeGoalCountByProjectIds,
    getDeepChildrenProjectsId,
    getAllProjectsQuery,
    getProjectChildrenTreeQuery,
    getProjectById,
    getChildrenProjectByParentProjectId,
    getUserProjects,
    getUserProjectsByGoals,
    getRealDashboardQueryByProjectIds,
} from '../queries/projectV2';
import { queryWithFiltersSchema, sortableProjectsPropertiesArraySchema } from '../../src/schema/common';
import {
    Project,
    User,
    Goal,
    Tag,
    State,
    GoalAchieveCriteria,
    Ghost,
    Activity,
    Priority,
    Team,
} from '../../src/utils/db/generated/kysely/types';
import { calculateProjectRules, ExtractTypeFromGenerated, pickUniqueValues, ProjectRoles } from '../utils';
import { baseCalcCriteriaWeight } from '../../src/utils/recalculateCriteriaScore';
import { getGoalsQuery } from '../queries/goalV2';
import { projectAccessMiddleware } from '../access/accessMiddlewares';
import { getAccessUsersByProjectId } from '../queries/activity';
import { recalculateGoalRanksIfNeeded } from '../queries/ranking';

type ProjectActivity = ExtractTypeFromGenerated<Activity> & {
    user: ExtractTypeFromGenerated<User> | null;
    ghost: ExtractTypeFromGenerated<Ghost> | null;
};

type ProjectResponse = ExtractTypeFromGenerated<Project> & {
    _isWatching: boolean;
    _isStarred: boolean;
    _isOwner: boolean;
    _isEditable: boolean;
    _isGoalWatching: boolean;
    _isGoalStarred: boolean;
    _isGoalParticipant: boolean;
    _onlySubsGoals: boolean;
    activity: ProjectActivity;
    participants: ProjectActivity[] | null;
    goals?: any[]; // this prop is overrides below
    children: ExtractTypeFromGenerated<Project>[] | null;
};

interface DashboardProject extends Pick<ProjectResponse, 'id'> {
    partnerProjectIds?: string[];
    readRights: { fullProject: true; onlySubs: false } | { fullProject: false; onlySubs: true };
    _count: {
        children: number;
        stargizers: number;
        watchers: number;
        participants: number;
        goals: number;
    };
}

type ProjectGoal = ExtractTypeFromGenerated<Goal> & {
    _shortId: string;
    participants: ProjectActivity[];
    tags: ExtractTypeFromGenerated<Tag>[];
    owner: ProjectActivity;
    _achivedCriteriaWeight: number | null;
    state: ExtractTypeFromGenerated<State>;
    priority: ExtractTypeFromGenerated<Priority>;
    project: ExtractTypeFromGenerated<Project> & { parent: ExtractTypeFromGenerated<Project>[] };
    partnershipProjects: Array<ExtractTypeFromGenerated<Project>>;
    criteria?: Array<
        ExtractTypeFromGenerated<
            GoalAchieveCriteria & {
                criteriaGoal: ExtractTypeFromGenerated<Goal> & { state: ExtractTypeFromGenerated<State> | null };
            }
        >
    >;
    _count: {
        comments: number;
        stargizers: number;
        watchers: number;
        participants: number;
    };
    _isWatching: boolean;
    _isStarred: boolean;
    _isOwner: boolean;
    _isEditable: boolean;
    _isIssuer: boolean;
    _isParticipant: boolean;
    _isParentParticipant: boolean;
    _isParentOwner: boolean;
    _hasAchievementCriteria: boolean;
};

export interface ProjectTree {
    [key: string]: {
        project: (ProjectResponse & Pick<DashboardProject, '_count'>) | null;
        count?: number;
        children: ProjectTree | null;
    };
}

export interface ProjectTreeRow {
    id: string;
    title: string;
    goal_count: number;
    chain: string[];
    deep: number;
}

type ProjectById = Omit<ProjectResponse, 'goals'> &
    Pick<DashboardProject, '_count'> & {
        parent: Array<{ id: string; title: string }>;
        accessUsers: Array<ProjectActivity>;
        teams: Array<Team> | null;
        children?: Array<{ id: string; title: string }>;
    };

export const project = router({
    suggestions: protectedProcedure
        .input(projectSuggestionsSchema)
        .query(async ({ input: { query, take = 5, filter }, ctx }) => {
            const { activityId } = ctx.session.user;

            try {
                const sql = getProjectSuggestions({
                    query,
                    filter,
                    limit: take,
                    activityId,
                });

                const res = await sql.execute();

                return res;
            } catch (error) {
                console.error(error);

                return Promise.reject(error);
            }
        }),
    userProjects: protectedProcedure
        .input(userProjectsSchema)
        .query(async ({ ctx, input: { take, filter, includePersonal } }) => {
            const { activityId } = ctx.session.user;
            try {
                const query = getUserProjectsQuery({
                    activityId,
                    limit: take,
                    filter,
                    includePersonal,
                });

                const res = await query.$castTo<ProjectResponse>().execute();

                return res;
            } catch (error) {
                console.error(error);

                return Promise.reject();
            }
        }),

    starred: protectedProcedure.query(async ({ ctx }) => {
        const { activityId, role } = ctx.session.user;
        try {
            const projectIds = await getStarredProjectsIds(activityId).execute();

            if (!projectIds?.length) {
                return [];
            }

            return getProjectsByIds({ activityId, in: projectIds, role })
                .$castTo<ProjectResponse & Pick<DashboardProject, '_count'>>()
                .execute();
        } catch (e) {
            console.log(e);
        }
    }),

    deepChildrenIds: protectedProcedure.input(projectsChildrenIdsSchema).query(async ({ input }) => {
        return getDeepChildrenProjectsId(input).execute();
    }),

    getUserDashboardProjects: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                goalsQuery: queryWithFiltersSchema.optional(),
                cursor: z.number().optional(),
                projectsSort: sortableProjectsPropertiesArraySchema.optional(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const { limit = 5, cursor: offset = 0, goalsQuery, projectsSort: _ } = input;
            const {
                session: { user },
            } = ctx;

            const allDashboardProjectsRules = await Promise.all([
                getUserProjects(user).execute(),
                getUserProjectsByGoals(user).execute(),
            ]).then(([p1, p2]) => {
                const projectMap: { [key: string]: number[] } = {};

                for (const record of p1.concat(p2)) {
                    const { pid, role } = record;
                    if (!(pid in projectMap)) {
                        projectMap[pid] = [];
                    }

                    projectMap[pid].push(role);
                }

                return new Map<string, ReturnType<typeof calculateProjectRules>>(
                    Object.entries(projectMap).map(([pid, roles]) => {
                        return [pid, calculateProjectRules(Array.from(new Set(roles)))];
                    }),
                );
            });

            if (allDashboardProjectsRules.size === 0) {
                return {
                    groups: [],
                    pagination: {
                        limit,
                        offset: undefined,
                    },
                    totalGoalsCount: 0,
                };
            }

            const dashboardProjects = await getRealDashboardQueryByProjectIds({
                rules: allDashboardProjectsRules,
                goalsQuery,
                ...user,
                limit: limit + 1,
                offset,
            })
                .$castTo<DashboardProject>()
                .execute();

            const projectIds = dashboardProjects.map(({ id }) => ({ id }));

            const [extendedProjects, goalsCountsByProjects] = await Promise.all([
                getProjectsByIds({
                    ...user,
                    in: projectIds,
                })
                    .$castTo<ProjectResponse>()
                    .execute(),
                getWholeGoalCountByProjectIds({ in: projectIds }).execute(),
            ]);

            const projectsExtendedDataMap = new Map(extendedProjects.map((project) => [project.id, project]));

            const resultProjects: (ProjectResponse & Pick<DashboardProject, '_count' | 'partnerProjectIds'>)[] = [];

            for (const { id, _count, partnerProjectIds, readRights } of dashboardProjects.slice(0, limit)) {
                const currentProject = projectsExtendedDataMap.get(id) as
                    | (ProjectResponse & Pick<DashboardProject, '_count' | 'partnerProjectIds'>)
                    | undefined;

                if (currentProject == null) {
                    throw new Error(`Missing project by id: ${id}`);
                }

                const {
                    _isEditable,
                    _isGoalStarred,
                    _isGoalWatching,
                    _isGoalParticipant,
                    _isOwner,
                    _isStarred,
                    _isWatching,
                    ...project
                } = currentProject;

                const flags = {
                    _isEditable,
                    _isOwner,
                    _isStarred,
                    _isWatching,
                    _isGoalStarred,
                    _isGoalWatching,
                    _isGoalParticipant,
                    _onlySubsGoals: readRights.onlySubs,
                    ...readRights,
                };

                resultProjects.push({ ...project, ...flags, _count, partnerProjectIds });
            }

            return {
                groups: resultProjects,
                pagination: {
                    limit,
                    offset: dashboardProjects.length < limit + 1 ? undefined : offset + (limit ?? 0),
                },
                totalGoalsCount: (goalsCountsByProjects || []).reduce(
                    (acc, count) => acc + (count?.wholeGoalsCount ?? 0),
                    0,
                ),
            };
        }),

    getAll: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                goalsQuery: queryWithFiltersSchema.optional(),
                projectsSort: sortableProjectsPropertiesArraySchema.optional(),
                cursor: z.number().optional(),
            }),
        )
        .query(async ({ input, ctx }) => {
            const { limit = 20, cursor = 0, goalsQuery, projectsSort } = input;

            const projects = await getAllProjectsQuery({
                ...ctx.session.user,
                firstLevel: goalsQuery?.project == null,
                limit: limit + 1,
                cursor,
                goalsQuery,
                projectsSort,
            })
                .$castTo<Omit<ProjectResponse, 'children'> & Pick<DashboardProject, '_count'>>()
                .execute();

            return {
                projects: projects.slice(0, limit),
                pagination: {
                    limit,
                    offset: projects.length < limit + 1 ? undefined : cursor + (limit ?? 0),
                },
            };
        }),

    getProjectChildrenTree: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                goalsQuery: queryWithFiltersSchema.optional(),
            }),
        )
        .query(
            async ({
                input,
                ctx: {
                    session: { user },
                },
            }) => {
                const rows = await getProjectChildrenTreeQuery(input).$castTo<ProjectTreeRow>().execute();
                const projects = await getProjectsByIds({
                    in: rows.map(({ id }) => ({ id })),
                    ...user,
                })
                    .where(({ or, eb, not, exists }) =>
                        or([
                            eb('Project.id', 'in', ({ selectFrom }) =>
                                selectFrom('_projectAccess').select('B').where('A', '=', user.activityId),
                            ),
                            not(
                                exists(({ selectFrom }) =>
                                    selectFrom('_projectAccess').select('B').whereRef('B', '=', 'Project.id'),
                                ),
                            ),
                        ]),
                    )
                    .$castTo<ProjectResponse & Pick<DashboardProject, '_count'>>()
                    .execute();

                const projectMap = new Map<string, ProjectTree[string]['project']>(
                    projects.map((project) => [project.id, project]),
                );

                const map: ProjectTree = {};

                rows.forEach(({ id, chain, goal_count: count, deep }) => {
                    const path = Array.from(chain);

                    path.reduce((acc, key, i) => {
                        if (!acc[key]) {
                            acc[key] = {
                                project: projectMap.get(key) || null,
                                children: {
                                    [id]: {
                                        project: projectMap.get(id) || null,
                                        count,
                                        children: null,
                                    },
                                },
                            };
                        } else if (i + 1 === deep) {
                            acc[key].children = {
                                ...acc[key].children,
                                [id]: {
                                    project: projectMap.get(id) || null,
                                    count,
                                    children: null,
                                },
                            };
                        }

                        return acc[key].children as ProjectTree;
                    }, map);
                });

                return map;
            },
        ),

    getById: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                includeChildren: z.boolean().optional(),
                goalsQuery: queryWithFiltersSchema.optional(),
            }),
        )
        .use(projectAccessMiddleware)
        .query(async ({ input, ctx }) => {
            const { id } = input;

            const [project, accessUsers, children = null] = await Promise.all([
                getProjectById({
                    ...ctx.session.user,
                    id,
                })
                    .$castTo<ProjectById>()
                    .executeTakeFirst(),
                getAccessUsersByProjectId({ projectId: id }).execute(),
                input.includeChildren ? getChildrenProjectByParentProjectId({ id }).execute() : Promise.resolve(null),
            ]);

            if (project == null) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            return {
                ...project,
                ...(children != null ? { children } : undefined),
                parent: pickUniqueValues(project.parent, 'id'),
                participants: pickUniqueValues(project.participants, 'id'),
                accessUsers,
            };
        }),

    getProjectGoalsById: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                askRights: z.boolean().optional(),
                limit: z.number().optional(),
                cursor: z.number().optional(),
                goalsQuery: queryWithFiltersSchema.optional(),
            }),
        )
        .query(async ({ input, ctx }) => {
            const { limit = 10, cursor: offset = 0, goalsQuery, id, askRights } = input;
            if (input.goalsQuery?.sort?.some(({ key }) => key === 'rank')) {
                await recalculateGoalRanksIfNeeded(id, ctx.session.user.activityId);
            }

            let currentProjectRights: Map<string, Array<ProjectRoles>> | null = null;

            if (askRights) {
                currentProjectRights = await Promise.all([
                    getUserProjects({ ...ctx.session.user, projectId: id }).execute(),
                    getUserProjectsByGoals({ ...ctx.session.user, projectId: id }).execute(),
                ]).then(([p1, p2]) => {
                    const projectMap: { [key: string]: number[] } = {};

                    for (const record of p1.concat(p2)) {
                        const { pid, role } = record;
                        if (!(pid in projectMap)) {
                            projectMap[pid] = [];
                        }

                        projectMap[pid].push(role);
                    }

                    return new Map<string, Array<ProjectRoles>>(
                        Object.entries(projectMap).map(([pid, roles]) => {
                            return [pid, Array.from(new Set(roles))];
                        }),
                    );
                });
            }

            if (input.goalsQuery?.sort?.some(({ key }) => key === 'rankGlobal')) {
                await recalculateGoalRanksIfNeeded(id);
            }

            const goalsByProjectQuery = getGoalsQuery({
                ...ctx.session.user,
                projectId: id,
                limit: limit + 1,
                offset,
                goalsQuery,
                readRights: currentProjectRights?.get(id),
            });

            const goals = await goalsByProjectQuery.$castTo<ProjectGoal>().execute();

            for (const goal of goals) {
                goal._achivedCriteriaWeight = goal.completedCriteriaWeight;

                if (goal.criteria != null) {
                    const uniqCriteria = pickUniqueValues(goal.criteria, 'id') as NonNullable<ProjectGoal['criteria']>;
                    goal._achivedCriteriaWeight = baseCalcCriteriaWeight(uniqCriteria);
                    goal.criteria = uniqCriteria;
                }
            }

            return {
                goals: goals.slice(0, limit),
                pagination: {
                    limit,
                    offset: goals.length < limit + 1 ? undefined : offset + (limit ?? 0),
                },
            };
        }),
});
