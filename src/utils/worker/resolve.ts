import { prisma } from '../prisma';

import * as emailTemplates from './mail/templates';
import { sendMail } from './mail';
import { JobDataMap } from './create';
import { getSheep } from './sheep';

export const email = async ({ template, data }: JobDataMap['email']) => {
    const renderedTemplate = await emailTemplates[template](data);
    return sendMail(renderedTemplate);
};

export const cron = async ({ template }: JobDataMap['cron']) => {
    if (template === 'goalPing') {
        const targetDate = new Date();

        targetDate.setMonth(targetDate.getMonth() - 1);

        const goals = await prisma.goal.findMany({
            where: {
                updatedAt: {
                    lte: targetDate,
                },
            },
        });

        const { activityId } = (await getSheep()) ?? {};

        if (activityId) {
            return prisma.comment.createMany({
                data: goals.map(({ id }) => ({
                    goalId: id,
                    description: 'There has been no activity for this goal for a long time 🔪',
                    activityId,
                })),
            });
        }

        throw new Error('No avalible sheeps');
    } else {
        throw new Error('No supported cron jobs');
    }
};
