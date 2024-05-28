import { z } from 'zod';
import { sql } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/postgres';

import { router, protectedProcedure } from '../trpcBackend';
import { userProjectsSchema } from '../../src/schema/project';
import { getChildrenProjectsId, getProjectList, getProjectsByIds } from '../queries/projectV2';
import { queryWithFiltersSchema } from '../../src/schema/common';
import {
    Project,
    User,
    Goal,
    Tag,
    State,
    GoalAchieveCriteria,
    Ghost,
    Role,
    Activity,
} from '../../generated/kysely/types';
import { ExtractTypeFromGenerated, pickUniqueValues } from '../utils';
import { baseCalcCriteriaWeight } from '../../src/utils/recalculateCriteriaScore';
import { db } from '../connection/kysely';

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

export const project = router({
    userProjects: protectedProcedure.input(userProjectsSchema).query(async ({ ctx, input: { take, filter } }) => {
        const { activityId, role } = ctx.session.user;
        try {
            const query = getProjectList({
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

            const baseProjectQuery = getProjectList({
                activityId: ctx.session.user.activityId,
                role: ctx.session.user.role,
                goalsQuery,
                limit: limit + 1,
                offset,
            });

            // eslint-disable-next-line newline-per-chained-call
            const res = await baseProjectQuery.clearSelect().clearLimit().clearOffset().select('Project.id').execute();

            const allProjects = await fetchRecursiveProjects(res);

            const extendedProjectsQuery = getProjectsByIds({
                ...ctx.session.user,
                in: allProjects,
            })
                .orderBy('Project.updatedAt desc')
                .limit(limit + 1)
                .offset(offset);

            const projectsWithGoals = db
                .selectFrom('Project')
                .innerJoinLateral(
                    ({ selectFrom }) =>
                        /**
                         * TODO:
                         * find the decision for pass closure `selectFrom` func
                         * as queryBuilder inside any query function
                         */
                        selectFrom('Goal')
                            .innerJoin('User as owner', 'owner.activityId', 'Goal.ownerId')
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
                                            qb
                                                .selectFrom('_goalParticipants')
                                                .select('A')
                                                .whereRef('B', '=', 'Goal.id'),
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
                                        .select([
                                            sql`
                                                case
                                                    when "criteriaGoal" != null
                                                    then to_json("criteriaGoal")
                                                    else null
                                                end
                                            `.as('criteriaGoal'),
                                        ])
                                        .whereRef('GoalAchieveCriteria.goalId', '=', 'Goal.id')
                                        .as('criteria'),
                                (join) => join.onTrue(),
                            )
                            .selectAll('Goal')
                            .select([
                                sql<string>`concat("Goal"."projectId", '-', "Goal"."scopeId")::text`.as('_shortId'),
                                jsonBuildObject({
                                    comments: sql<number>`(select count("Comment".id) from "Comment" where "Comment"."goalId" = "Goal".id)`,
                                }).as('_count'),
                                sql`(
                                    case
                                        when count(participant) > 0
                                        then array_agg(
                                            json_build_object(
                                                'activityId', participant."activityId",
                                                'user', to_jsonb(participant)
                                            )
                                        )
                                        else null
                                    end)`.as('participants'),
                                sql`(case when count(tag) > 0 then array_agg(to_jsonb(tag)) else null end)`.as('tags'),
                                sql`
                                    json_build_object(
                                        'activityId', owner."activityId",
                                        'user', to_jsonb(owner)
                                    )
                                `.as('owner'),
                                sql`to_jsonb(state)`.as('state'),
                                sql`to_jsonb(priority)`.as('priority'),
                                sql`(case when count(criteria) > 0 then array_agg(to_jsonb(criteria)) else null end)`.as(
                                    'criteria',
                                ),
                            ])
                            .whereRef('Goal.projectId', '=', 'Project.id')
                            .where('Goal.archived', 'is not', true)
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
                            .$if(goalsQuery?.stateType != null && goalsQuery.stateType.length > 0, (qb) =>
                                qb.where('Goal.stateId', 'in', ({ selectFrom }) =>
                                    selectFrom('State')
                                        .select('State.id')
                                        .where('State.type', 'in', goalsQuery?.stateType || []),
                                ),
                            )
                            .$if(goalsQuery?.state != null && goalsQuery.state.length > 0, (qb) =>
                                qb.where('Goal.stateId', 'in', goalsQuery?.state || []),
                            )
                            .$if(goalsQuery?.tag != null && goalsQuery.tag.length > 0, (qb) =>
                                qb.where('tag.id', 'in', goalsQuery?.tag || []),
                            )
                            .$if(goalsQuery?.participant != null && goalsQuery.participant.length > 0, (qb) =>
                                qb.where('participant.activityId', 'in', goalsQuery?.participant || []),
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
                                                    selectFrom('_projectAccess')
                                                        .select('B')
                                                        .where('A', '=', user.activityId),
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
                            .limit(30)
                            .orderBy('Goal.updatedAt desc')
                            .groupBy(['Goal.id', 'owner.id', 'state.id', 'priority.id'])
                            .as('goal'),
                    (join) => join.onTrue(),
                )
                .select(['Project.id', sql`array_agg(to_json(goal))`.as('goals')])
                .where(
                    'Project.id',
                    'in',
                    allProjects.map(({ id }) => id),
                )
                .groupBy(['Project.id'])
                .orderBy('Project.updatedAt desc')
                .limit(limit + 1)
                .offset(offset);

            const countQuery = getProjectList(ctx.session.user)
                .clearLimit()
                .clearSelect()
                .clearWhere()
                .select((eb) => [
                    'Project.id',
                    eb
                        .selectFrom('Goal')
                        .select(({ fn }) => [fn.count('Goal.id').as('count')])
                        .where('Goal.archived', 'is not', true)
                        .whereRef('Project.id', '=', 'Goal.projectId')
                        .as('goalsCount'),
                ])
                .where(
                    'Project.id',
                    'in',
                    allProjects.map(({ id }) => id),
                )
                .groupBy('Project.id');

            return Promise.all([
                extendedProjectsQuery.$castTo<ProjectResponse>().execute(),
                projectsWithGoals.$castTo<ProjectsWithGoals>().execute(),
                countQuery.$castTo<{ id: string; goalsCount: string }>().execute(),
            ]).then(([projects, goalsByProject, goalsCountsByProjects]) => {
                const resultProjects = projects.slice(0, limit);
                const mapGoalListByProject = new Map(goalsByProject.map(({ id, goals }) => [id, goals]));

                for (const project of resultProjects) {
                    const p = project as ProjectsWithGoals;
                    const currentProjectGoals = mapGoalListByProject.get(p.id);

                    if (currentProjectGoals) {
                        for (const goal of currentProjectGoals) {
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
                        p.goals = currentProjectGoals;
                    }
                }

                return {
                    groups: resultProjects,
                    pagiantion: {
                        limit,
                        offset: projects.length < limit + 1 ? undefined : offset + (limit ?? 0),
                    },
                    totalGoalsCount: goalsCountsByProjects.reduce<number>((acc, { goalsCount }) => {
                        if (!Number.isNaN(+goalsCount)) {
                            return acc + Number(goalsCount);
                        }
                        return acc;
                    }, 0),
                };
            });
        }),
});
