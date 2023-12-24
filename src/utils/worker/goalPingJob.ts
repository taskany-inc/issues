import { StateType } from '@prisma/client';

import { prisma } from '../prisma';
import { prepareRecipients } from '../prepareRecipients';

import { getSheep } from './sheep';
import { createEmailJob } from './create';

const fetchGoals = (date: Date) =>
    prisma.goal.findMany({
        where: {
            updatedAt: {
                lte: date,
            },
            state: {
                type: {
                    in: [StateType.InProgress, StateType.NotStarted],
                },
            },
            archived: { not: true },
        },
        include: {
            participants: { include: { user: true, ghost: true } },
            watchers: { include: { user: true, ghost: true } },
            activity: { include: { user: true, ghost: true } },
            owner: { include: { user: true, ghost: true } },
        },
    });

type Goal = Awaited<ReturnType<typeof fetchGoals>>[number];

const commentsJobQueue: Goal[] = [];
const ids = new Set<string>();

const commentsMinInterval = 300;
let commentsInterval: NodeJS.Timer | null = null;
const commentsPeriod = 1000 * 60 * 60 * 24;

export const goalPingJob = async () => {
    const { activityId } = (await getSheep()) ?? {};

    if (!activityId) {
        throw new Error('No avalible sheeps');
    }

    const targetDate = new Date();

    targetDate.setMonth(targetDate.getMonth() - 1);

    const goals = await fetchGoals(targetDate);

    if (!goals.length) {
        return;
    }

    goals.forEach((goal) => {
        if (!ids.has(goal.id)) {
            ids.add(goal.id);
            commentsJobQueue.push(goal);
        }
    });

    if (!commentsInterval) {
        const interval = Math.max(Math.floor(commentsPeriod / goals.length), commentsMinInterval);

        const createComment = async () => {
            const goal = commentsJobQueue.pop();

            if (goal) {
                ids.delete(goal.id);

                const comment = await prisma.comment.create({
                    data: {
                        goalId: goal.id,
                        description: 'There has been no activity for this goal for a long time 🔪',
                        activityId,
                    },
                    include: {
                        activity: {
                            include: {
                                user: true,
                            },
                        },
                    },
                });

                if (comment.activity.user) {
                    await createEmailJob('goalCommented', {
                        to: prepareRecipients([...goal.participants, ...goal.watchers, goal.activity, goal.owner]),
                        shortId: `${goal.projectId}-${goal.scopeId}`,
                        title: goal.title,
                        commentId: comment.id,
                        author: comment.activity.user.name || comment.activity.user.email,
                        authorEmail: comment.activity.user.email,
                        body: comment.description,
                    });
                }
            } else if (commentsInterval) {
                clearInterval(commentsInterval);
            }
        };

        createComment();
        commentsInterval = setInterval(() => createComment, interval);
    }
};
