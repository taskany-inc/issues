import { StateType } from '@prisma/client';

import { prisma } from '../prisma';

import { getSheep } from './sheep';
import { createCommentJob } from './create';

const commentsMinInterval = 300;
const commentsPeriod = 1000 * 60 * 60 * 24;

export const goalPingJob = async () => {
    const { activityId } = (await getSheep()) ?? {};

    if (!activityId) {
        throw new Error('No avalible sheeps');
    }

    const targetDate = new Date();

    targetDate.setMonth(targetDate.getMonth() - 1);

    const [goals, jobs] = await Promise.all([
        prisma.goal.findMany({
            where: {
                updatedAt: {
                    lte: targetDate,
                },
                state: {
                    type: {
                        in: [StateType.InProgress, StateType.NotStarted],
                    },
                },
                archived: { not: true },
            },
        }),
        prisma.job.findMany({
            where: {
                data: {
                    path: ['activityId'],
                    equals: activityId,
                },
                kind: 'comment',
            },
        }),
    ]);

    if (!goals.length) {
        return;
    }

    const interval = Math.max(Math.floor(commentsPeriod / goals.length), commentsMinInterval);

    const jobsIds = jobs.reduce((acum, job) => {
        if (job.data && typeof job.data === 'object' && !Array.isArray(job.data)) {
            acum.add(String(job.data.goalId));
        }
        return acum;
    }, new Set<string>());

    goals.forEach(async (goal, i) => {
        if (!jobsIds.has(goal.id)) {
            await createCommentJob(
                {
                    goalId: goal.id,
                    description: 'There has been no activity for this goal for a long time 🔪',
                    activityId,
                },
                i * interval,
            );
        }
    });
};
