import { z } from 'zod';

import { router, protectedProcedure } from '../trpcBackend';
import { userProjectsSchema } from '../../src/schema/project';
import {
    getChildrenProjectsId,
    getProjectsByIds,
    getUserProjectsQuery,
    getUserProjectsWithGoals,
    getWholeGoalCountByProjectIds,
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
    children: any[]; // TODO: rly need this on Dashboard Page
    _count: {
        children: number;
        stargizers: number;
        watchers: number;
        participants: number;
        goals: number;
    };
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
}

const fetchRecursiveProjects = async <R extends { id: string }>(outerRes: R[], cursor = 0, level = 0): Promise<R[]> => {
    return getChildrenProjectsId({ in: outerRes.slice(cursor, outerRes.length) })
        .execute()
        .then((res) => {
            if (!res?.length || level === 1) {
                return outerRes;
            }

            cursor = outerRes.length;
            outerRes.push(...(res as R[]));

            return fetchRecursiveProjects(outerRes, cursor, level + 1);
        });
};

export const project = router({
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

            // eslint-disable-next-line newline-per-chained-call
            const res = await getUserProjectsQuery({ ...user, includeSubsGoals: true })
                .clearLimit()
                .clearSelect()
                .select('Project.id')
                .execute();

            const allProjects = await fetchRecursiveProjects(res);

            const extendedProjectsQuery = getProjectsByIds({
                ...user,
                in: allProjects,
            });

            const projectsWithGoals = getUserProjectsWithGoals({
                ...user,
                in: allProjects,
                goalsQuery,
                limit: limit + 1,
                offset,
            });

            const countQuery = getWholeGoalCountByProjectIds({
                in: allProjects,
            });

            return Promise.all([
                extendedProjectsQuery.$castTo<ProjectResponse>().execute(),
                projectsWithGoals.$castTo<ProjectsWithGoals>().execute(),
                countQuery.executeTakeFirst(),
            ]).then(([projects, goalsByProject, goalsCountsByProjects]) => {
                const projectsExtendedDataMap = new Map(projects.map((project) => [project.id, project]));

                const resultProjects = [];

                for (const { id, goals } of goalsByProject.slice(0, limit)) {
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

                    resultProjects.push(currentProject);
                }

                return {
                    groups: resultProjects,
                    pagination: {
                        limit,
                        offset: goalsByProject.length < limit + 1 ? undefined : offset + (limit ?? 0),
                    },
                    totalGoalsCount: goalsCountsByProjects?.wholeGoalsCount ?? 0,
                };
            });
        }),
});
