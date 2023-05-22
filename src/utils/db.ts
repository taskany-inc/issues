import { nanoid } from 'nanoid';

import { GoalCommon } from '../schema/goal';

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

    return prisma.goal.update({
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
