import { customAlphabet, nanoid } from 'nanoid';
import { alphanumeric } from 'nanoid-dictionary';
import { GoalHistory, Comment, Activity, User, Goal, Role, Prisma, Reaction, StateType } from '@prisma/client';
import { TRPCError } from '@trpc/server';

import { GoalCommon, dependencyKind, exceptionsDependencyKind } from '../schema/goal';
import {
    addCalculatedGoalsFields,
    addCommonCalculatedGoalFields,
    nonArchievedGoalsPartialQuery,
} from '../../trpc/queries/goals';
import { HistoryRecordWithActivity, HistoryRecordSubject, castToSubject } from '../types/history';
import { ReactionsMap } from '../types/reactions';
import { getProjectSchema } from '../../trpc/queries/project';

import { prisma } from './prisma';
import { subjectToEnumValue } from './goalHistory';
import { safeGetUserEmail, safeGetUserName } from './getUserName';
import { calcAchievedWeight } from './recalculateCriteriaScore';

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

    return {
        ...goal,
        ...addCalculatedGoalsFields(goal, activityId, role),
    };
};

export const createPersonalProject = async ({
    ownerId,
    activityId,
    role,
}: {
    ownerId: string;
    activityId: string;
    role: Role;
}) => {
    const usersInclude = {
        activity: { include: { user: true, ghost: true } },
        participants: { include: { user: true, ghost: true } },
        watchers: { include: { user: true, ghost: true } },
    };

    const { include, where } = getProjectSchema({
        role,
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

    return prisma.project.create({
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

type RequestParamsBySubject = { [K in keyof HistoryRecordSubject]?: { ids: string[]; sourceIdx: number[] } };

export const goalHistorySeparator = ', ';

export const getGoalHistory = async <T extends GoalHistory & { activity: Activity & { user: User | null } }>(
    history: T[],
) => {
    const requestParamsBySubjects = history.reduce<RequestParamsBySubject>(
        (acc, { subject, previousValue, nextValue }, index) => {
            const allValues = (previousValue ?? '')
                .split(goalHistorySeparator)
                .concat((nextValue ?? '').split(goalHistorySeparator))
                .filter(Boolean);

            if (subjectToEnumValue(subject)) {
                acc[subject] = {
                    ids: (acc[subject]?.ids ?? []).concat(...allValues),
                    sourceIdx: (acc[subject]?.sourceIdx ?? []).concat(index),
                };
            }

            return acc;
        },
        {},
    );

    const historyWithMeta: HistoryRecordWithActivity[] = [];
    const needRequestForSubject = Object.keys(requestParamsBySubjects) as (keyof typeof requestParamsBySubjects)[];
    const replacedValueIdx = needRequestForSubject
        .map((subject) => (requestParamsBySubjects[subject] || {}).sourceIdx)
        .flat();

    if (needRequestForSubject.length) {
        const results = await Promise.all(
            needRequestForSubject.map((subject) => {
                const { ids } = requestParamsBySubjects[subject] || {};

                const query = {
                    where: {
                        id: {
                            in: ids,
                        },
                    },
                };

                switch (subject) {
                    case 'dependencies':
                        return prisma.goal
                            .findMany({
                                where: query.where,
                                include: {
                                    state: true,
                                },
                            })
                            .then((deps) => deps.map((dep) => ({ ...dep, ...addCommonCalculatedGoalFields(dep) })));
                    case 'tags':
                        return prisma.tag.findMany(query);
                    case 'owner':
                    case 'participants':
                        return prisma.activity.findMany({
                            where: query.where,
                            include: {
                                user: true,
                                ghost: true,
                            },
                        });
                    case 'state':
                        return prisma.state.findMany({ where: query.where });
                    case 'project':
                        return prisma.project.findMany({ where: query.where });
                    case 'partnerProject':
                        return prisma.project.findMany({ where: query.where });
                    case 'criteria':
                        return prisma.goalAchieveCriteria.findMany({
                            where: query.where,
                            include: {
                                criteriaGoal: {
                                    include: {
                                        state: true,
                                    },
                                },
                            },
                        });
                    case 'priority':
                        return prisma.priority.findMany({ where: query.where });
                    default:
                        throw new Error('query for history record is undefined');
                }
            }),
        );

        const meta: Map<string, (typeof results)[number][number]> = new Map(
            results.flat().map((value) => [value.id, value]),
        );

        history.forEach((item, index) => {
            const valueCanBeArray = ['dependencies', 'tags', 'estimates'].includes(item.subject);
            let prev;
            let next;

            if (valueCanBeArray) {
                prev = item.previousValue?.split(goalHistorySeparator).map((id) => meta.get(id)) ?? null;
                next = item.nextValue?.split(goalHistorySeparator).map((id) => meta.get(id)) ?? null;
            } else {
                prev = item.previousValue ? meta.get(item.previousValue) : null;
                next = item.nextValue ? meta.get(item.nextValue) : null;
            }

            if (castToSubject(item)) {
                if (replacedValueIdx.includes(index)) {
                    historyWithMeta[index] = {
                        ...item,
                        previousValue: prev || null,
                        nextValue: next || null,
                    };
                } else {
                    historyWithMeta[index] = item;
                }
            }
        });
    }

    return historyWithMeta;
};

type MixHistoryWithCommentsReturnType<H, C> =
    | { type: 'history'; value: H }
    | { type: 'comment'; value: Omit<C, 'reactions'> & { reactions: ReactionsMap } };

export const mixHistoryWithComments = <
    H extends HistoryRecordWithActivity,
    C extends Comment & { reactions: (Reaction & Pick<HistoryRecordWithActivity, 'activity'>)[] },
>(
    history: H[],
    comments: C[],
): {
    _activityFeed: MixHistoryWithCommentsReturnType<H, C>[];
    _comments: Extract<MixHistoryWithCommentsReturnType<H, C>, { type: 'comment' }>['value'][];
    comments: C[];
} => {
    const activity: MixHistoryWithCommentsReturnType<H, C>[] = history.map((record) => {
        return {
            type: 'history',
            value: record,
        };
    });

    const limit = 10;
    const _comments = comments?.map((comment) => {
        const reactions = comment?.reactions?.reduce<ReactionsMap>((acc, cur) => {
            const data = {
                activityId: cur.activityId,
                name: safeGetUserName(cur.activity),
            };

            if (acc[cur.emoji]) {
                acc[cur.emoji].count += 1;
                acc[cur.emoji].authors.push(data);
            } else {
                acc[cur.emoji] = {
                    count: 1,
                    authors: [data],
                    remains: 0,
                };
            }

            return acc;
        }, {});

        for (const key in reactions) {
            if (key in reactions) {
                const { authors } = reactions[key];

                if (authors.length > limit) {
                    reactions[key].authors = authors.slice(0, limit);
                    reactions[key].remains = authors.length - limit;
                }
            }
        }

        return {
            ...comment,
            reactions,
        };
    });

    for (const comment of _comments) {
        activity.push({
            type: 'comment',
            value: comment,
        });
    }

    return {
        _activityFeed: activity.sort((a, b) => a.value.createdAt.getTime() - b.value.createdAt.getTime()),
        _comments,
        comments: [],
    };
};

type GoalRelation<T> = T & { _kind: dependencyKind | exceptionsDependencyKind } & ReturnType<
        typeof addCalculatedGoalsFields
    >;
export const makeGoalRelationMap = <T extends Goal>(
    values: Record<dependencyKind | exceptionsDependencyKind, T[]>,
    activityId: string,
    role: Role,
): Array<{ kind: dependencyKind; goals: GoalRelation<T>[] }> => {
    const entriesValues = Object.entries(values) as [dependencyKind | exceptionsDependencyKind, T[]][];

    const dependenciesMap = entriesValues.reduce<Record<dependencyKind, GoalRelation<T>[]>>(
        (acc, [kind, goals]) => {
            const goalsWithKindByDependency = goals.map((goal) => ({
                ...goal,
                ...addCalculatedGoalsFields(goal, activityId, role),
                _kind: kind,
            }));

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
                        OR: [
                            {
                                criteriaGoalId: { in: goalIds.map(({ id }) => id) },
                            },
                            {
                                goalIdAsCriteria: { in: goalIds.map(({ id }) => id) },
                            },
                        ],
                    },
                    data: { deleted: true },
                });

                await Promise.all([archiveGoals, createHistoryRecords, updateCriterias]);

                // get all goals which current project's goals as criteria
                const res = await ctx.goalAchieveCriteria.findMany({
                    where: {
                        OR: [
                            {
                                criteriaGoalId: { in: goalIds.map(({ id }) => id) },
                            },
                            {
                                goalIdAsCriteria: { in: goalIds.map(({ id }) => id) },
                            },
                        ],
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
