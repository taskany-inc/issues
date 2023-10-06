import { nanoid } from 'nanoid';
import { GoalHistory, Comment, Activity, User, Goal, Role, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';

import { GoalCommon, dependencyKind } from '../schema/goal';
import { addCalclulatedGoalsFields, calcAchievedWeight } from '../../trpc/queries/goals';
import { HistoryRecordWithActivity, HistoryRecordSubject, HistoryAction } from '../types/history';

import { prisma } from './prisma';
import { subjectToEnumValue } from './goalHistory';

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
export const createGoal = async (input: GoalCommon, activityId: string, role: Role) => {
    const id = nanoid();

    await prisma.$executeRaw`
        INSERT INTO "Goal" ("id", "title", "description", "projectId", "ownerId", "activityId", "stateId", "priority", "scopeId")
        SELECT
            ${id},
            ${input.title},
            ${input.description || ''},
            ${input.parent.id},
            ${input.owner.id},
            ${activityId},
            ${input.state.id},
            ${input.priority},
            coalesce(max("scopeId"), 0) + 1
        FROM "Goal" WHERE "projectId" = ${input.parent.id};
    `;

    const goal = await prisma.goal.update({
        where: {
            id,
        },
        data: {
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
            participants: {
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
        ...addCalclulatedGoalsFields(goal, activityId, role),
    };
};

export const changeGoalProject = async (id: string, newProjectId: string) => {
    return prisma.$executeRaw`
        UPDATE "Goal"
        SET "projectId" = ${newProjectId}, "scopeId" = (SELECT coalesce(max("scopeId"), 0) + 1 FROM "Goal" WHERE "projectId" = ${newProjectId})
        WHERE "id" = ${id};
    `;
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

    const historyWithMeta: HistoryRecordWithActivity[] = Array.from(history);
    const needRequestForSubject = Object.keys(requestParamsBySubjects) as (keyof typeof requestParamsBySubjects)[];
    const replacedValueIdx = needRequestForSubject
        .map((subject) => (requestParamsBySubjects[subject] || {}).sourceIdx)
        .flat();

    if (needRequestForSubject.length) {
        const results = await Promise.all(
            needRequestForSubject.map((subject) => {
                const data = requestParamsBySubjects[subject];

                const query = {
                    where: {
                        id: {
                            in: (data || {}).ids?.map((id) => id.trim()),
                        },
                    },
                };

                switch (subject) {
                    case 'dependencies':
                        return prisma.goal.findMany({
                            where: query.where,
                            include: {
                                state: true,
                            },
                        });
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
                    case 'criteria':
                        return prisma.goalAchieveCriteria.findMany({
                            where: query.where,
                            include: {
                                goalAsCriteria: {
                                    include: {
                                        state: true,
                                    },
                                },
                            },
                        });
                    default:
                        throw new Error('query for history record is undefined');
                }
            }),
        );

        const metaResults: Record<string, (typeof results)[number][number]>[] = [];

        for (const records of results) {
            const meta: Record<string, (typeof records)[number]> = {};

            for (const record of records) {
                meta[record.id] = record;
            }

            metaResults.push(meta);
        }

        const metaObj = metaResults.reduce((acc, values) => {
            acc = { ...acc, ...values };

            return acc;
        }, {});

        replacedValueIdx.forEach((sourceIndex) => {
            if (sourceIndex == null) {
                return;
            }

            const record = history[sourceIndex];
            const valueCanBeArray = ['dependencies', 'tags', 'estimates'].includes(record.subject);

            if (valueCanBeArray) {
                historyWithMeta[sourceIndex] = {
                    ...record,
                    action: record.action as HistoryAction,
                    previousValue: record.previousValue?.split(', ').map((id) => metaObj[id]),
                    nextValue: record.nextValue?.split(', ').map((id) => metaObj[id]),
                };
            } else {
                historyWithMeta[sourceIndex] = {
                    ...record,
                    action: record.action as HistoryAction,
                    previousValue: record.previousValue ? metaObj[record.previousValue] : null,
                    nextValue: record.nextValue ? metaObj[record.nextValue] : null,
                };
            }
        });
    }

    return historyWithMeta;
};

export const mixHistoryWithComments = <H extends HistoryRecordWithActivity, C extends Comment>(
    history: H[],
    comments: C[],
): Array<{ type: 'history'; value: H } | { type: 'comment'; value: C }> => {
    const activity: Array<{ type: 'history'; value: H } | { type: 'comment'; value: C }> = history.map((record) => {
        return {
            type: 'history',
            value: record,
        };
    });

    for (const comment of comments) {
        activity.push({
            type: 'comment',
            value: comment,
        });
    }

    return activity.sort((a, b) => a.value.createdAt.getTime() - b.value.createdAt.getTime());
};

export const makeGoalRelationMap = <T extends Goal>(
    values: Record<dependencyKind, T[]>,
): Array<{ kind: dependencyKind; goals: T[] }> => {
    return (Object.entries(values) as [dependencyKind, T[]][]).map(([kind, goals]) => ({ kind, goals }));
};

export const updateGoalWithCalculatedWeight = async (goalId: string) => {
    const criteriaList = await prisma.goalAchieveCriteria.findMany({
        where: {
            goalId,
            OR: [
                {
                    deleted: false,
                },
                {
                    deleted: null,
                },
            ],
        },
        include: {
            goalAsCriteria: {
                include: {
                    state: true,
                },
            },
        },
    });

    try {
        await prisma.$transaction(async (ctx) => {
            // update goal score by criteria list
            const updatedGoal = await ctx.goal.update({
                where: { id: goalId },
                data: {
                    completedCriteriaWeight: criteriaList.length ? calcAchievedWeight(criteriaList) : null,
                },
            });

            if (!updatedGoal) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
            }

            // update project score after goal score update
            if (updatedGoal.projectId) {
                await ctx.$executeRaw`
                    UPDATE "Project"
                    SET "averageScore" = (SELECT AVG("completedCriteriaWeight") FROM "Goal"
                        WHERE "projectId" = ${updatedGoal.projectId} AND "archived" IS NOT true)
                    WHERE "id" = ${updatedGoal.projectId};
                `;
            }
        });
    } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', cause: error, message: error?.message });
    }
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
                        goalIdAsCriteria: {
                            in: goalIds.map(({ id }) => id),
                        },
                    },
                    data: { deleted: true },
                });

                await Promise.all([archiveGoals, createHistoryRecords, updateCriterias]);

                // get all goals which current project's goals as criteria
                const linkedGoalsWithCriteria = await ctx.goal.findMany({
                    where: {
                        goalAchiveCriteria: {
                            some: {
                                goalIdAsCriteria: { in: goalIds.map(({ id }) => id) },
                            },
                        },
                    },
                    select: {
                        id: true,
                        goalAchiveCriteria: {
                            include: {
                                goalAsCriteria: {
                                    include: { state: true },
                                },
                            },
                        },
                    },
                });

                if (linkedGoalsWithCriteria.length) {
                    const inFilter = Prisma.join(linkedGoalsWithCriteria.map(({ id }) => id));
                    const values = Prisma.join(
                        linkedGoalsWithCriteria.map((value) =>
                            Prisma.join([value.id, calcAchievedWeight(value.goalAchiveCriteria)], ',', '(', ')'),
                        ),
                    );

                    const tempTableValues = Prisma.sql`(VALUES${values}) AS criteria(goalId, score)`;
                    const tempSelectScoreGoals = Prisma.sql`
                        SELECT avg(g."completedCriteriaWeight") AS score, g."projectId" AS "projectId"
                            FROM "Goal" AS g
                            WHERE g.id IN (${inFilter}) AND g.archived IS NOT TRUE
                            GROUP BY g."projectId"
                    `;

                    // update goal score after mark criteria as deleted
                    await ctx.$executeRaw`
                        UPDATE "Goal" AS goal
                            SET "completedCriteriaWeight" = criteria.score
                            FROM ${tempTableValues}
                        WHERE goal.id = criteria.goalId;
                    `;

                    // recalc average affected projects score
                    await ctx.$executeRaw`
                        UPDATE "Project" AS project
                            SET "averageScore" = goal."score"
                            FROM (${tempSelectScoreGoals}) AS goal
                            WHERE project.id = goal."projectId";
                        `;
                }
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', cause: error, message: error?.message });
        }
    }
};
