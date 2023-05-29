import { nanoid } from 'nanoid';
import { GoalHistory, PrismaClient } from '@prisma/client';

import { GoalCommon } from '../schema/goal';
import { addCalclulatedGoalsFields } from '../../trpc/queries/goals';

import { prisma } from './prisma';

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
            max("scopeId") + 1
        FROM "Goal" WHERE "projectId" = ${input.parent.id};
    `;

    const goal = await prisma.goal.update({
        where: {
            id,
        },
        data: {
            tags: input.tags?.length
                ? {
                      connect: input.tags,
                  }
                : undefined,
            estimate: input.estimate
                ? {
                      create: {
                          ...input.estimate,
                          activityId,
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
    await prisma.$executeRaw`
        UPDATE "Goal"
        SET "projectId" = ${newProjectId}, "scopeId" = (SELECT max("scopeId") + 1 FROM "Goal" WHERE "projectId" = ${newProjectId})
        WHERE "id" = ${id};
    `;

    return prisma.goal.findUnique({
        where: {
            id,
        },
    });
};

const subjectToTableNameMap: Record<string, keyof PrismaClient> = {
    dependencies: 'goal',
    project: 'project',
    tags: 'tag',
    owner: 'activity',
    participant: 'activity',
    state: 'state',
};

export const getGoalHistory = async (history: GoalHistory[]) => {
    const needRequestForRecordIndicies = history.reduce<number[]>((acc, { subject }, index) => {
        if (subjectToTableNameMap[subject]) {
            acc.push(index);
        }

        return acc;
    }, []);

    const historyWithMeta: (GoalHistory & { meta?: Record<string, unknown> })[] = Array.from(history);

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
                    include: {
                        activity: {
                            include: {
                                user: true,
                            },
                        },
                    },
                };

                switch (record.subject) {
                    case 'project':
                        return prisma.project.findMany(query);
                    case 'dependencies':
                        return prisma.goal.findMany(query);
                    case 'tags':
                        return prisma.tag.findMany(query);
                    case 'owner':
                    case 'participant':
                        return prisma.activity.findMany({
                            where: query.where,
                            include: {
                                user: true,
                            },
                        });
                    case 'state':
                        return prisma.state.findMany({ where: query.where });
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

        let transactionResultIndex = 0;

        historyWithMeta.forEach((record, index) => {
            if (needRequestForRecordIndicies.includes(index) && metaResults[transactionResultIndex]) {
                historyWithMeta[index] = {
                    ...record,
                    meta: metaResults[transactionResultIndex],
                };

                transactionResultIndex += 1;
            }
        });
    }

    return historyWithMeta;
};
