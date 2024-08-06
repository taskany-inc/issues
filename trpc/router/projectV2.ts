import { z } from 'zod';
import { sql } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/postgres';

import { router, protectedProcedure } from '../trpcBackend';
import { projectSuggestionsSchema, userProjectsSchema } from '../../src/schema/project';
import {
    getProjectsByIds,
    getStarredProjectsIds,
    getProjectSuggestions,
    getUserProjectsQuery,
    getUserProjectsWithGoals,
    getWholeGoalCountByProjectIds,
    getAllProjectsQuery,
    getChildrenProjectQuery,
} from '../queries/projectV2';
import { queryWithFiltersSchema } from '../../src/schema/common';
import { Project, User, Goal, Tag, State, GoalAchieveCriteria, Ghost, Activity } from '../../generated/kysely/types';
import { ExtractTypeFromGenerated, pickUniqueValues } from '../utils';
import { baseCalcCriteriaWeight } from '../../src/utils/recalculateCriteriaScore';

type ProjectActivity = ExtractTypeFromGenerated<Activity> & {
    user: ExtractTypeFromGenerated<User> | null;
    ghost: ExtractTypeFromGenerated<Ghost> | null;
};

type ProjectResponse = ExtractTypeFromGenerated<Project> & {
    _isWatching: boolean;
    _isStarred: boolean;
    _isOwner: boolean;
    _isEditable: boolean;
    activity: ProjectActivity;
    participants: ProjectActivity[];
    goals?: any[]; // this prop is overrides below
    children: ExtractTypeFromGenerated<Project>[] | null;
};

interface ProjectsWithGoals extends Pick<ProjectResponse, 'id'> {
    goals: (ExtractTypeFromGenerated<Goal> & {
        _shortId: string;
        participants: ProjectActivity[] | null;
        tags: Tag[] | null;
        owner: ProjectActivity;
        _achivedCriteriaWeight: number | null;
        criteria?: Array<
            ExtractTypeFromGenerated<
                GoalAchieveCriteria & {
                    criteriaGoal: ExtractTypeFromGenerated<Goal> & { state: ExtractTypeFromGenerated<State> | null };
                }
            >
        >;
    })[];
    _count: {
        children: number;
        stargizers: number;
        watchers: number;
        participants: number;
        goals: number;
    };
}

export const project = router({
    suggestions: protectedProcedure
        .input(projectSuggestionsSchema)
        .query(async ({ input: { query, take = 5, filter }, ctx }) => {
            const { activityId, role } = ctx.session.user;

            try {
                const sql = getProjectSuggestions({
                    role,
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
    userProjects: protectedProcedure.input(userProjectsSchema).query(async ({ ctx, input: { take, filter } }) => {
        const { activityId, role } = ctx.session.user;
        try {
            const query = getUserProjectsQuery({
                activityId,
                role,
                limit: take,
                filter,
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
                .select([
                    jsonBuildObject({
                        stargizers: sql<number>`(select count("A") from "_projectStargizers" where "B" = "Project".id)`,
                        watchers: sql<number>`(select count("A") from "_projectWatchers" where "B" = "Project".id)`,
                        children: sql<number>`(select count("B") from "_parentChildren" where "A" = "Project".id)`,
                        participants: sql<number>`(select count("A") from "_projectParticipants"  where "B" = "Project".id)`,
                    }).as('_count'),
                ])
                .$castTo<ProjectResponse & Pick<ProjectsWithGoals, '_count'>>()
                .execute();
        } catch (e) {
            console.log(e);
        }
    }),

    userProjectsWithGoals: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                goalsQuery: queryWithFiltersSchema.optional(),
                cursor: z.number().optional(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const { limit = 5, cursor: offset = 0, goalsQuery } = input;
            const {
                session: { user },
            } = ctx;

            const goalsByProject = await getUserProjectsWithGoals({
                ...user,
                goalsQuery,
                limit: limit + 1,
                offset,
            })
                .$castTo<ProjectsWithGoals>()
                .execute();

            const projectIds = goalsByProject.map(({ id }) => ({ id }));

            const [extendedProjects, goalsCountsByProjects] = await Promise.all([
                getProjectsByIds({
                    ...user,
                    in: projectIds,
                })
                    .$castTo<ProjectResponse>()
                    .execute(),
                getWholeGoalCountByProjectIds({ in: projectIds }).executeTakeFirst(),
            ]);

            const projectsExtendedDataMap = new Map(extendedProjects.map((project) => [project.id, project]));

            const resultProjects = [];

            for (const { id, goals, _count } of goalsByProject.slice(0, limit)) {
                const currentProject = projectsExtendedDataMap.get(id);
                if (currentProject == null) {
                    throw new Error(`Missing project by id: ${id}`);
                }

                if (goals) {
                    for (const goal of goals) {
                        goal.participants = pickUniqueValues(goal.participants, 'id');
                        goal.tags = pickUniqueValues(goal.tags, 'id');

                        goal._achivedCriteriaWeight = null;

                        if (goal.criteria != null) {
                            const uniqCriteria = pickUniqueValues(goal.criteria, 'id') as NonNullable<
                                ProjectsWithGoals['goals'][number]['criteria']
                            >;
                            // FIX: maybe try calculate in sql
                            goal._achivedCriteriaWeight = baseCalcCriteriaWeight(uniqCriteria);
                            delete goal.criteria;
                        }
                    }
                    currentProject.goals = goals;
                }

                resultProjects.push({ ...currentProject, _count });
            }

            return {
                groups: resultProjects,
                pagination: {
                    limit,
                    offset: goalsByProject.length < limit + 1 ? undefined : offset + (limit ?? 0),
                },
                totalGoalsCount: goalsCountsByProjects?.wholeGoalsCount ?? 0,
            };
        }),

    getAll: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional(),
                goalsQuery: queryWithFiltersSchema.optional(),
                firstLevel: z.boolean(),
                cursor: z.number().optional(),
            }),
        )
        .query(async ({ input, ctx }) => {
            const { limit = 20, cursor = 0, goalsQuery, firstLevel: _ = true } = input;

            const projects = await getAllProjectsQuery({
                ...ctx.session.user,
                firstLevel: goalsQuery?.project == null,
                limit: limit + 1,
                cursor,
                ids: goalsQuery?.project,
            })
                .$castTo<Omit<ProjectResponse, 'children'> & Pick<ProjectsWithGoals, '_count'>>()
                .execute();

            return {
                projects: projects.slice(0, limit),
                pagination: {
                    limit,
                    offset: projects.length < limit + 1 ? undefined : cursor + (limit ?? 0),
                },
            };
        }),
    getProjectChildren: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            }),
        )
        .query(async ({ input, ctx }) => {
            const childrenQuery = getChildrenProjectQuery({ ...ctx.session.user, id: input.id }).$castTo<
                Omit<ProjectResponse, 'goals'> & Pick<ProjectsWithGoals, '_count'>
            >();

            const res = await childrenQuery.execute();

            return res;
        }),
});
