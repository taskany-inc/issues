import { customAlphabet, nanoid } from 'nanoid';
import { alphanumeric } from 'nanoid-dictionary';
import { Goal, Role, Prisma, StateType } from '@prisma/client';
import { TRPCError } from '@trpc/server';

import { GoalCommon, dependencyKind, exceptionsDependencyKind } from '../../schema/goal';
import { nonArchievedGoalsPartialQuery } from '../../../trpc/queries/goals';
import { getProjectSchema } from '../../../trpc/queries/project';
import { prisma } from '../prisma';
import { safeGetUserEmail, safeGetUserName } from '../getUserName';
import { calcAchievedWeight } from '../recalculateCriteriaScore';

import { db } from './connection/kysely';
import { getProjectsEditableStatus } from './getProjectEditable';
import { addCalculatedGoalsFields } from './calculatedGoalsFields';

/**
 * Type-safe wrapper in raw SQL query.
 * This is only one way to create scopeId in one transaction to avoid id constraints.
 * We are using short id's like FRNTND-23 on client side, but this is not real id,
 * this is concatanation of Goal.projectId and Goal.scopeId.
 * ProjectId is a scope for goals in the Goal table.
 *
 * @param activityId issuer id
 * @param input goal FormData
 * @returns new goal id
 */
export const createGoal = async (input: GoalCommon, projectId: string, activityId: string, role: Role) => {
    const id = nanoid();
    const priorityId = input.priority.id;

    await prisma.$executeRaw`
        INSERT INTO "Goal" ("id", "title", "description", "projectId", "ownerId", "activityId", "stateId", "priorityId", "scopeId")
        SELECT
            ${id},
            ${input.title},
            ${input.description || ''},
            ${projectId},
            ${input.owner.id},
            ${activityId},
            ${input.state.id},
            ${priorityId},
            coalesce(max("scopeId"), 0) + 1
        FROM "Goal" WHERE "projectId" = ${projectId};
    `;

    const goal = await prisma.goal.update({
        where: {
            id,
        },
        data: {
            priority: {
                connect: {
                    id: priorityId,
                },
            },
            tags: input.tags?.length
                ? {
                      connect: input.tags.map(({ id }) => ({ id })),
                  }
                : undefined,
            estimate: input.estimate ? new Date(input.estimate.date) : null,
            estimateType: input.estimate?.type,
            watchers: {
                connect: [{ id: activityId }, { id: input.owner.id }],
            },
        },
        include: {
            activity: { include: { user: true, ghost: true } },
            owner: { include: { user: true, ghost: true } },
        },
    });

    const projectIds = [goal?.projectId || ''].filter(Boolean);
    const editableMap = await getProjectsEditableStatus(projectIds, activityId, role);

    return {
        ...goal,
        ...addCalculatedGoalsFields(
            goal,
            { _isEditable: Boolean(goal?.projectId && editableMap.get(goal.projectId)) },
            activityId,
            role,
        ),
    };
};

export const createPersonalProject = async ({ ownerId, activityId }: { ownerId: string; activityId: string }) => {
    const usersInclude = {
        activity: { include: { user: true, ghost: true } },
        participants: { include: { user: true, ghost: true } },
        watchers: { include: { user: true, ghost: true } },
    };

    const { include, where } = getProjectSchema({
        activityId,
        whereQuery: {
            personal: true,
            activityId: ownerId,
            accessUsers: {
                some: {
                    id: activityId,
                },
            },
        },
    });

    const existedProject = await prisma.project.findFirst({
        where,
        include: {
            ...include,
            ...usersInclude,
        },
    });

    if (existedProject) {
        return existedProject;
    }

    const [owner, suggestedFlows] = await Promise.all([
        prisma.activity.findUnique({
            where: {
                id: ownerId,
            },
            include: { user: true, ghost: true },
        }),
        prisma.flow.findMany({
            where: {
                recommended: true,
            },
            include: {
                states: true,
            },
        }),
    ]);

    const flow = suggestedFlows[0];

    if (!owner) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `No user with id ${ownerId}` });
    }

    if (!flow) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No suggested flow' });
    }

    const newProject = prisma.project.create({
        data: {
            id: owner.user?.nickname?.replace(/\s/g, '') || customAlphabet(alphanumeric)(),
            title: `Personal for ${safeGetUserName(owner) || safeGetUserEmail(owner)}`,
            activityId: ownerId,
            personal: true,
            flowId: flow.id,
            accessUsers: {
                connect: [
                    {
                        id: activityId,
                    },
                ],
            },
        },
        include: usersInclude,
    });

    return newProject;
};

export const countPrivateDependencies = async ({
    projectId,
    scopeId,
}: {
    projectId: string;
    scopeId: number;
}): Promise<{
    goalAchiveCriteria: number;
    dependsOn: number;
    relatedTo: number;
    blocks: number;
}> => {
    const depsWhere = {
        NOT: {
            project: {
                accessUsers: {
                    none: {},
                },
            },
        },
        ...nonArchievedGoalsPartialQuery,
    };

    const data = await prisma.goal.findFirst({
        where: {
            projectId,
            scopeId,
            archived: false,
        },
        include: {
            _count: {
                select: {
                    goalAchiveCriteria: {
                        where: {
                            criteriaGoal: {
                                id: {},
                            },
                            NOT: {
                                criteriaGoal: {
                                    project: {
                                        accessUsers: {
                                            none: {},
                                        },
                                    },
                                },
                            },
                            OR: [{ deleted: false }, { deleted: null }],
                        },
                    },
                    dependsOn: {
                        where: depsWhere,
                    },
                    relatedTo: {
                        where: depsWhere,
                    },
                    blocks: {
                        where: depsWhere,
                    },
                },
            },
        },
    });

    if (!data) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Goal is absent' });
    }

    return data._count;
};

export const changeGoalProject = async (id: string, newProjectId: string) => {
    return prisma.$executeRaw`
        UPDATE "Goal"
        SET "projectId" = ${newProjectId}, "scopeId" = (SELECT coalesce(max("scopeId"), 0) + 1 FROM "Goal" WHERE "projectId" = ${newProjectId})
        WHERE "id" = ${id};
    `;
};

export const clearEmptyPersonalProject = async (id?: string | null) => {
    if (!id) {
        return null;
    }

    const project = await prisma.project.findUnique({
        where: {
            id,
        },
        include: {
            goals: true,
        },
    });

    if (project && project.personal && !project.goals.length) {
        return prisma.project.delete({
            where: {
                id,
            },
        });
    }

    return null;
};

type GoalRelation<T> = T & { _kind: dependencyKind | exceptionsDependencyKind } & ReturnType<
        typeof addCalculatedGoalsFields
    >;
export const makeGoalRelationMap = async <T extends Goal>(
    values: Record<dependencyKind | exceptionsDependencyKind, T[]>,
    activityId: string,
    role: Role,
): Promise<Array<{ kind: dependencyKind; goals: GoalRelation<T>[] }>> => {
    const entriesValues = Object.entries(values) as [dependencyKind | exceptionsDependencyKind, T[]][];

    const allGoals = entriesValues.flatMap(([_, goals]) => goals);
    const allProjectIds = allGoals.map((goal) => goal.projectId || '').filter(Boolean);

    const editableMap = await getProjectsEditableStatus(allProjectIds, activityId, role);

    const dependenciesMap = entriesValues.reduce<Record<dependencyKind, GoalRelation<T>[]>>(
        (acc, [kind, goals]) => {
            const goalsWithKindByDependency = goals.map((goal) => {
                return {
                    ...goal,
                    ...addCalculatedGoalsFields(
                        goal,
                        { _isEditable: Boolean(goal.projectId && editableMap.get(goal.projectId)) },
                        activityId,
                        role,
                    ),
                    _kind: kind,
                };
            });

            if (kind === exceptionsDependencyKind.connected) {
                acc[dependencyKind.relatedTo].push(...goalsWithKindByDependency);
                return acc;
            }

            acc[kind].push(...goalsWithKindByDependency);
            return acc;
        },
        {
            [dependencyKind.blocks]: [],
            [dependencyKind.dependsOn]: [],
            [dependencyKind.relatedTo]: [],
        },
    );

    return (Object.entries(dependenciesMap) as [dependencyKind, GoalRelation<T>[]][]).map(([kind, goals]) => ({
        kind,
        goals,
    }));
};

export const updateLinkedGoalsByProject = async (projectId: string, activityId: string) => {
    // current projects's goals
    const goalIds = await prisma.goal.findMany({
        where: {
            projectId,
            AND: {
                archived: {
                    not: true,
                },
            },
        },
        select: {
            id: true,
        },
    });

    if (goalIds.length) {
        try {
            await prisma.$transaction(async (ctx) => {
                // move all active goals to archive
                const archiveGoals = ctx.goal.updateMany({
                    where: {
                        projectId,
                        AND: {
                            archived: { not: true },
                        },
                    },
                    data: { archived: true },
                });

                // create history records for these goals
                const createHistoryRecords = ctx.goalHistory.createMany({
                    data: goalIds.map(({ id }) => ({
                        subject: 'state',
                        action: 'archive',
                        activityId,
                        nextValue: 'move to archive',
                        goalId: id,
                    })),
                });

                // mark criterias with these goals as deleted
                const updateCriterias = ctx.goalAchieveCriteria.updateMany({
                    where: {
                        criteriaGoalId: { in: goalIds.map(({ id }) => id) },
                    },
                    data: { deleted: true },
                });

                const removePartnershipGoals = ctx.$executeRaw`
                    DELETE FROM "_partnershipProjects"
                    WHERE "B" = ${projectId};
                `;

                await Promise.all([archiveGoals, createHistoryRecords, updateCriterias, removePartnershipGoals]);

                // get all goals which current project's goals as criteria
                const res = await ctx.goalAchieveCriteria.findMany({
                    where: {
                        criteriaGoalId: { in: goalIds.map(({ id }) => id) },
                    },
                    include: {
                        criteriaGoal: {
                            include: { state: true },
                        },
                        goal: {
                            include: { state: true },
                        },
                    },
                });

                const linkedGoals = res.reduce<Record<string, Array<(typeof res)[number]>>>((acc, criteria) => {
                    if (!acc[criteria.goalId]) {
                        acc[criteria.goalId] = [];
                    }

                    acc[criteria.goalId].push(criteria);

                    return acc;
                }, {});

                if (Object.keys(linkedGoals).length) {
                    const inFilter = Prisma.join(Object.keys(linkedGoals));
                    const values = Prisma.join(
                        Object.entries(linkedGoals).map(([id, list]) =>
                            Prisma.join([id, calcAchievedWeight(list)], ',', '(', ')'),
                        ),
                    );

                    const tempTableValues = Prisma.sql`(VALUES${values}) AS criteria(goalId, score)`;

                    // update goal score after mark criteria as deleted
                    await ctx.$executeRaw`
                        UPDATE "Goal" AS goal
                            SET "completedCriteriaWeight" = criteria.score
                            FROM ${tempTableValues}
                        WHERE goal.id = criteria.goalId;
                    `;

                    const projectsToUpdate = Prisma.sql`
                        SELECT DISTINCT g."projectId" FROM "Goal" as g
                        WHERE g.id IN (${inFilter}) AND g."archived" IS NOT TRUE
                    `;

                    // recalc average affected projects score
                    await ctx.$executeRaw`
                        UPDATE "Project" AS project
                            SET "averageScore" = goal."score"
                            FROM (
                                SELECT
                                    g."projectId",
                                    AVG(
                                        CASE
                                            WHEN g."completedCriteriaWeight" IS NOT NULL AND g."completedCriteriaWeight" > 0 THEN g."completedCriteriaWeight"
                                            WHEN state.type = '${Prisma.raw(
                                                StateType.Completed,
                                            )}' AND g."completedCriteriaWeight" IS NULL THEN 100
                                            ELSE 0
                                        END
                                    )::int
                                FROM "Goal" AS g
                                INNER JOIN "State" AS state ON state.id = g."stateId"
                                WHERE g."projectId" IN (${projectsToUpdate}) AND g.archived IS NOT TRUE
                                GROUP BY 1
                            ) AS goal("projectId", score)
                            WHERE project.id = goal."projectId";
                        `;
                }
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', cause: error, message: error?.message });
        }
    }
};

export const fetchConfig = async () => {
    const result = await db.selectFrom('AppConfig').selectAll().executeTakeFirst();

    if (!result) {
        return null;
    }

    return result;
};
