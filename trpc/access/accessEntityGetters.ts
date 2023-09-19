import { prisma } from '../../src/utils/prisma';
import { goalDeepQuery } from '../queries/goals';

export const getGoal = (id: string) =>
    prisma.goal.findUnique({
        where: { id },
        include: goalDeepQuery,
    });

export type GoalEntity = NonNullable<Awaited<ReturnType<typeof getGoal>>>;

export const getComment = (id: string) =>
    prisma.comment.findUnique({
        where: { id },
    });

export type CommentEntity = NonNullable<Awaited<ReturnType<typeof getComment>>>;

export const getProject = (id: string) =>
    prisma.project.findUnique({
        where: { id },
    });

export type ProjectEntity = NonNullable<Awaited<ReturnType<typeof getProject>>>;
