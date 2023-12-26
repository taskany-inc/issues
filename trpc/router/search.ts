import { z } from 'zod';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { getGoalDeepQuery } from '../queries/goals';
import { getProjectAccessFilter } from '../queries/access';
import { addCalculatedGoalsFields } from '../../src/utils/db/calculatedGoalsFields';

export const search = router({
    global: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
        const { activityId, role } = ctx.session.user;

        const [goals, projects] = await Promise.all([
            prisma.goal.findMany({
                take: 5,
                where: {
                    AND: [
                        {
                            OR: [
                                {
                                    title: {
                                        contains: input,
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    description: {
                                        contains: input,
                                        mode: 'insensitive',
                                    },
                                },
                            ],
                        },
                        {
                            archived: {
                                not: true,
                            },
                        },
                        {
                            project: {
                                ...getProjectAccessFilter(activityId, role),
                            },
                        },
                    ],
                },
                include: getGoalDeepQuery({
                    activityId,
                    role,
                }),
            }),
            prisma.project.findMany({
                take: 5,
                where: {
                    personal: false,
                    OR: [
                        {
                            title: {
                                contains: input,
                                mode: 'insensitive',
                            },
                        },
                        {
                            description: {
                                contains: input,
                                mode: 'insensitive',
                            },
                        },
                    ],
                    ...getProjectAccessFilter(activityId, role),
                },
                include: {
                    activity: {
                        include: {
                            user: true,
                            ghost: true,
                        },
                    },
                },
            }),
        ]);

        return {
            goals: goals.map((g) => ({
                ...g,
                ...addCalculatedGoalsFields(g, activityId, role),
            })),
            projects,
        };
    }),
});
