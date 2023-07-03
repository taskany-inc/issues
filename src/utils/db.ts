import { nanoid } from 'nanoid';
import { GoalHistory, Comment, Activity, User, Goal } from '@prisma/client';

import { GoalCommon, GoalUpdate, dependencyKind } from '../schema/goal';
import { addCalclulatedGoalsFields } from '../../trpc/queries/goals';
import { HistoryRecordWithActivity, HistoryRecordMeta, HistoryRecordSubject, HistoryAction } from '../types/history';

import { prisma } from './prisma';
import { castToMetaDto, subjectToEnumValue } from './goalHistory';

export const findOrCreateEstimate = async (
    estimate: GoalCommon['estimate'] | GoalUpdate['estimate'],
    activityId: string,
    goalId: string,
) => {
    if (!estimate) {
        return null;
    }

    let currentEstimate = { ...estimate };

    if (estimate.id == null) {
        const { id: _, ...whereParams } = currentEstimate;
        const realEstimate = await prisma.estimate.findFirst({
            where: whereParams,
        });

        if (realEstimate) {
            currentEstimate.id = realEstimate.id;
        } else {
            currentEstimate = await prisma.estimate.create({
                data: {
                    date: estimate.date,
                    y: estimate.y,
                    q: estimate.q,
                    activityId,
                    goalId,
                },
            });
        }
    }

    return currentEstimate;
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

export const getGoalHistory = async <T extends GoalHistory & { activity: Activity & { user: User | null } }>(
    history: T[],
    goalId: string,
) => {
    const needRequestForRecordIndicies = history.reduce<number[]>((acc, { subject }, index) => {
        if (subjectToEnumValue(subject)) {
            acc.push(index);
        }

        return acc;
    }, []);

    const historyWithMeta: HistoryRecordWithActivity[] = Array.from(history);

    if (needRequestForRecordIndicies.length) {
        const results = await prisma.$transaction(
            needRequestForRecordIndicies.map((recordIndex) => {
                const record = history[recordIndex];
                const [previousValue = [], nextValue = []] = [
                    record.previousValue?.split(', '),
                    record.nextValue?.split(', '),
                ];

                const query = {
                    where: {
                        id: {
                            in: previousValue?.concat(nextValue),
                        },
                    },
                };

                if (subjectToEnumValue(record.subject)) {
                    switch (record.subject) {
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
                        default:
                            throw new Error('query for history record is undefined');
                    }
                }

                throw new Error('query for history record is undefined');
            }),
        );

        const metaResults: Record<string, HistoryRecordMeta[keyof HistoryRecordSubject]>[] = [];

        for (const records of results) {
            const meta: Record<string, (typeof records)[number]> = {};

            for (const record of records) {
                meta[record.id] = record;
            }

            metaResults.push(meta);
        }

        let transactionResultIndex = 0;

        history.forEach((record, index) => {
            const currentMeta = metaResults[transactionResultIndex];
            if (
                needRequestForRecordIndicies.includes(index) &&
                subjectToEnumValue(record.subject) &&
                castToMetaDto(record.subject, currentMeta)
            ) {
                const valueCanBeArray = ['dependencies', 'tags'].includes(record.subject);

                if (valueCanBeArray) {
                    historyWithMeta[index] = {
                        ...record,
                        action: record.action as HistoryAction,
                        previousValue: record.previousValue?.split(', ').map((id) => currentMeta[id]),
                        nextValue: record.nextValue?.split(', ').map((id) => currentMeta[id]),
                    };
                } else {
                    historyWithMeta[index] = {
                        ...record,
                        action: record.action as HistoryAction,
                        previousValue: record.previousValue ? currentMeta[record.previousValue] : null,
                        nextValue: record.nextValue ? currentMeta[record.nextValue] : null,
                    };
                }

                transactionResultIndex += 1;
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
