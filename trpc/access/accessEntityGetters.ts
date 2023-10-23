import { TRPCError } from '@trpc/server';

import { prisma } from '../../src/utils/prisma';
import { goalDeepQuery } from '../queries/goals';

export const getGoal = (id: string) =>
    prisma.goal.findUnique({
        where: { id },
        include: goalDeepQuery,
    });

export const getGoalByShortId = (id: string) => {
    const [projectId, scopeIdStr] = id.split('-');

    if (!projectId) return null;

    const scopeId = parseInt(scopeIdStr, 10);

    if (!scopeId) return null;

    return prisma.goal.findFirst({
        where: { projectId, scopeId, archived: false },
        include: goalDeepQuery,
    });
};

export type GoalEntity = NonNullable<Awaited<ReturnType<typeof getGoal>>>;

export const getGoalByCriteria = async (id: string) => {
    const actualCriteria = await prisma.goalAchieveCriteria.findUnique({
        where: { id },
    });

    if (!actualCriteria?.goalId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Criteria not found' });
    }

    return getGoal(actualCriteria.goalId);
};

export const getComment = (id: string) =>
    prisma.comment.findUnique({
        where: { id },
    });

export type CommentEntity = NonNullable<Awaited<ReturnType<typeof getComment>>>;

export const getProject = (id: string) =>
    prisma.project.findUnique({
        where: { id },
        include: {
            participants: {
                include: {
                    user: true,
                    ghost: true,
                },
            },
        },
    });

export type ProjectEntity = NonNullable<Awaited<ReturnType<typeof getProject>>>;
