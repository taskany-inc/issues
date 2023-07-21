import { nanoid } from 'nanoid';
import { z } from 'zod';
import { GoalHistory, Comment, Activity, User, Goal } from '@prisma/client';
import { TRPCError } from '@trpc/server';

import { GoalCommon, GoalUpdate, dependencyKind } from '../schema/goal';
import { addCalclulatedGoalsFields, calcAchievedWeight } from '../../trpc/queries/goals';
import { HistoryRecordWithActivity, HistoryRecordSubject, HistoryAction } from '../types/history';

import { prisma } from './prisma';
import { subjectToEnumValue } from './goalHistory';

export const findOrCreateEstimate = async (
    estimate: GoalCommon['estimate'] | GoalUpdate['estimate'],
    activityId: string,
    goalId: string,
) => {
    if (!estimate) {
        return null;
    }

    if (estimate.id == null) {
        const { id: _, q = null, date = null, ...whereParams } = estimate;

        const existingEstimate = await prisma.estimate.findFirst({
            where: { q, date, ...whereParams },
        });
        return (
            existingEstimate ||
            prisma.estimate.create({
                data: {
                    date: estimate.date,
                    y: estimate.y,
                    q: estimate.q,
                    activityId,
                    goalId,
                },
            })
        );
    }
};

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
export const createGoal = async (activityId: string, input: GoalCommon) => {
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

    const correctEstimate = await findOrCreateEstimate(input.estimate, activityId, id);

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
            estimate: correctEstimate?.id
                ? {
                      create: {
                          estimate: {
                              connect: {
                                  id: correctEstimate.id,
                              },
                          },
                      },
                  }
                : undefined,
            watchers: {
                connect: [{ id: activityId }, { id: input.owner.id }],
            },
            participants: {
                connect: [{ id: activityId }, { id: input.owner.id }],
            },
        },
    });

    return {
        ...goal,
        ...addCalclulatedGoalsFields(goal, activityId),
    };
};

export const changeGoalProject = async (id: string, newProjectId: string) => {
    return prisma.$executeRaw`
        UPDATE "Goal"
        SET "projectId" = ${newProjectId}, "scopeId" = (SELECT coalesce(max("scopeId"), 0) + 1 FROM "Goal" WHERE "projectId" = ${newProjectId})
        WHERE "id" = ${id};
    `;
};

const stringIsCiudOrId = (string: string): boolean => {
    const valueAsNumber = Number(string);

    if (String(valueAsNumber) === string) {
        return true;
    }

    return z.string().cuid().safeParse(string).success;
};

type RequestParamsBySubject = { [K in keyof HistoryRecordSubject]?: { ids: string[]; sourceIdx: number[] } };

export const getGoalHistory = async <T extends GoalHistory & { activity: Activity & { user: User | null } }>(
    history: T[],
    goalId: string,
) => {
    const requestParamsBySubjects = history.reduce<RequestParamsBySubject>(
        (acc, { subject, previousValue, nextValue }, index) => {
            const allValues = (previousValue ?? '')
                .split(',')
                .concat((nextValue ?? '').split(','))
                .filter(Boolean);
            const valuesAsIds = allValues.length ? allValues.every((val) => stringIsCiudOrId(val)) : false;

            if (subjectToEnumValue(subject) && valuesAsIds) {
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
    const replacedValueIdx = needRequestForSubject.map((subject) => requestParamsBySubjects[subject]!.sourceIdx).flat();

    if (needRequestForSubject.length) {
        const results = await Promise.all(
            needRequestForSubject.map((subject) => {
                const data = requestParamsBySubjects[subject];

                const query = {
                    where: {
                        id: {
                            in: data!.ids,
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
                            },
                        });
                    case 'state':
                        return prisma.state.findMany({ where: query.where });
                    case 'estimate':
                        return prisma.estimate.findMany({
                            where: {
                                id: {
                                    in: query.where.id.in.map((v) => Number(v)),
                                },
                                goal: {
                                    some: {
                                        goalId,
                                    },
                                },
                            },
                        });
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
            const record = history[sourceIndex];
            const valueCanBeArray = ['dependencies', 'tags'].includes(record.subject);

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
                        WHERE "projectId" = ${updatedGoal.projectId})
                    WHERE "id" = ${updatedGoal.projectId};
                `;
            }
        });
    } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', cause: error, message: error?.message });
    }
};
