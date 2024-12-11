import { TRPCError } from '@trpc/server';

import { prisma } from '../../src/utils/prisma';
import { goalDeepQuery } from '../queries/goals';

import { tr } from './access.i18n';

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
        throw new TRPCError({ code: 'NOT_FOUND', message: tr('Criteria not found') });
    }

    return getGoal(actualCriteria.goalId);
};

export const getComment = (id: string) =>
    prisma.comment.findUnique({
        where: { id },
    });

export type CommentEntity = NonNullable<Awaited<ReturnType<typeof getComment>>>;

export const getProject = (id: string) =>
    prisma.project
        .findUnique({
            where: { id },
            include: {
                accessUsers: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
                participants: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
                goals: {
                    include: {
                        stargizers: true,
                        watchers: true,
                        participants: true,
                    },
                },
            },
        })
        .then((project) => {
            if (project?.goals == null || project.goals.length === 0) {
                return project;
            }

            const { goals, ...restProject } = project;

            const goalAccessActivityIds = new Set<string>();

            for (const goal of goals) {
                const { ownerId, activityId, watchers, stargizers, participants } = goal;

                const unionSubArray = [...watchers, ...stargizers, ...participants];

                [ownerId, activityId, ...unionSubArray.map(({ id }) => id)].filter(Boolean).forEach((id) => {
                    goalAccessActivityIds.add(id);
                });
            }

            return {
                ...restProject,
                goalAccessIds: Array.from(goalAccessActivityIds),
            };
        });

export type ProjectEntity = NonNullable<Awaited<ReturnType<typeof getProject>>>;
